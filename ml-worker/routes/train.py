"""
POST /train — Fine-tune a base LLM with LoRA / QLoRA using SFTTrainer.

Returns HTTP 202 immediately; training runs in a background thread.
Progress is reported to callback_url every 10 steps.
"""

import gc
import logging
import os
import threading
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
import torch
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from config.settings import settings
from schemas.requests import TrainRequest
from schemas.responses import TrainStartResponse
from utils.callbacks import ProgressWebhookCallback
from utils.chat_templates import format_chat, get_available_templates
from utils.dataset import load_jsonl_dataset
from utils.hardware import get_hardware_info

logger = logging.getLogger(__name__)
router = APIRouter()

# ── In-memory job registry ────────────────────────────────────────────────────
# Maps job_id -> {"thread": Thread, "status": str, "error": str | None}
_RUNNING_JOBS: Dict[str, Dict[str, Any]] = {}
_JOBS_LOCK = threading.Lock()


# ── Helper: post final status ─────────────────────────────────────────────────

def _post_final_status(
    callback_url: str,
    job_id: str,
    status: str,
    adapter_path: Optional[str] = None,
    error: Optional[str] = None,
    step: int = 0,
    total_steps: int = 0,
) -> None:
    payload: Dict[str, Any] = {
        "job_id": job_id,
        "progress": 100.0 if status == "completed" else 0.0,
        "loss": None,
        "eval_loss": None,
        "epoch": None,
        "step": step,
        "total_steps": total_steps,
        "status": status,
        "error": error,
        "adapter_path": adapter_path,
    }
    try:
        with httpx.Client(timeout=settings.callback_timeout_seconds) as client:
            client.post(callback_url, json=payload)
    except Exception as exc:
        logger.warning(f"Could not POST final status to {callback_url}: {exc}")


# ── Training worker (runs in background thread) ───────────────────────────────

def _run_training(req: TrainRequest) -> None:
    job_id = req.job_id
    logger.info(f"[{job_id}] Training thread started")

    # Mark job as running
    with _JOBS_LOCK:
        _RUNNING_JOBS[job_id]["status"] = "running"

    try:
        _train(req)
    except Exception as exc:
        logger.error(f"[{job_id}] Training failed: {exc}", exc_info=True)
        with _JOBS_LOCK:
            _RUNNING_JOBS[job_id]["status"] = "failed"
            _RUNNING_JOBS[job_id]["error"] = str(exc)
        _post_final_status(req.callback_url, job_id, "failed", error=str(exc))
    finally:
        # Free GPU memory
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        logger.info(f"[{job_id}] Training thread exiting")


def _train(req: TrainRequest) -> None:  # noqa: C901
    """Core training logic — imports are inside to avoid loading on startup."""
    import math

    from datasets import Dataset as HFDataset
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
    from transformers import (
        AutoModelForCausalLM,
        AutoTokenizer,
        BitsAndBytesConfig,
        TrainingArguments,
    )
    from trl import SFTTrainer

    job_id = req.job_id
    cfg = req.config

    # ── Resolve paths ─────────────────────────────────────────────────────────
    dataset_path = req.dataset_path
    if not Path(dataset_path).is_absolute():
        dataset_path = str(Path(settings.upload_dir) / dataset_path)
    if not Path(dataset_path).exists():
        raise FileNotFoundError(f"Dataset not found: {dataset_path}")

    adapter_output_dir = str(Path(settings.models_dir) / req.project_id / "adapter")
    os.makedirs(adapter_output_dir, exist_ok=True)

    # ── Determine device & dtype ──────────────────────────────────────────────
    hw = get_hardware_info()
    device = hw["device"]
    use_qlora = cfg.use_qlora and device == "cuda"

    logger.info(f"[{job_id}] Device={device}, QLoRA={use_qlora}, model={req.hf_model_id}")

    # ── BitsAndBytes config ───────────────────────────────────────────────────
    bnb_config: Optional[BitsAndBytesConfig] = None
    if use_qlora:
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16,
            bnb_4bit_use_double_quant=True,
        )

    # ── Load tokenizer ────────────────────────────────────────────────────────
    logger.info(f"[{job_id}] Loading tokenizer: {req.hf_model_id}")
    tokenizer = AutoTokenizer.from_pretrained(
        req.hf_model_id,
        trust_remote_code=True,
        use_fast=True,
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"  # Required for SFTTrainer

    # ── Load base model ───────────────────────────────────────────────────────
    logger.info(f"[{job_id}] Loading base model: {req.hf_model_id}")
    model_kwargs: Dict[str, Any] = {
        "trust_remote_code": True,
        "use_cache": False,  # Disable KV cache during training
    }
    if use_qlora and bnb_config is not None:
        model_kwargs["quantization_config"] = bnb_config
        model_kwargs["device_map"] = "auto"
    elif device == "cuda":
        model_kwargs["torch_dtype"] = torch.bfloat16
        model_kwargs["device_map"] = "auto"
    elif device == "mps":
        model_kwargs["torch_dtype"] = torch.float16
        model_kwargs["device_map"] = "mps"
    else:
        model_kwargs["torch_dtype"] = torch.float32
        model_kwargs["device_map"] = "cpu"

    model = AutoModelForCausalLM.from_pretrained(req.hf_model_id, **model_kwargs)

    if use_qlora:
        model = prepare_model_for_kbit_training(model)
        logger.info(f"[{job_id}] Model prepared for kbit training")

    # ── LoRA config ───────────────────────────────────────────────────────────
    lora_config = LoraConfig(
        r=cfg.lora_rank,
        lora_alpha=cfg.lora_alpha,
        target_modules=req.target_modules,
        lora_dropout=cfg.lora_dropout,
        bias="none",
        task_type="CAUSAL_LM",
        inference_mode=False,
    )
    logger.info(
        f"[{job_id}] LoRA config: r={cfg.lora_rank}, alpha={cfg.lora_alpha}, "
        f"modules={req.target_modules}"
    )

    # ── Load and format dataset ───────────────────────────────────────────────
    logger.info(f"[{job_id}] Loading dataset from: {dataset_path}")
    raw_rows = load_jsonl_dataset(dataset_path)
    if not raw_rows:
        raise ValueError("Dataset is empty — no rows to train on.")

    # Determine chat template
    from config.models import BASE_MODELS
    template_name = "alpaca"
    if req.base_model_id in BASE_MODELS:
        template_name = BASE_MODELS[req.base_model_id].get("chat_template", "alpaca")

    def _format_row(row: Dict[str, Any]) -> str:
        return format_chat(
            instruction=row.get("instruction", ""),
            input_text=row.get("input", ""),
            output=row.get("output", ""),
            template_name=template_name,
        )

    # Split train / eval (90/10)
    split_idx = max(1, int(len(raw_rows) * 0.9))
    train_rows = raw_rows[:split_idx]
    eval_rows = raw_rows[split_idx:] or raw_rows[:1]  # at least 1 eval row

    train_texts = [_format_row(r) for r in train_rows]
    eval_texts = [_format_row(r) for r in eval_rows]

    train_dataset = HFDataset.from_dict({"text": train_texts})
    eval_dataset = HFDataset.from_dict({"text": eval_texts})

    logger.info(
        f"[{job_id}] Dataset: {len(train_texts)} train, {len(eval_texts)} eval rows, "
        f"template='{template_name}'"
    )

    # ── Compute total steps for progress reporting ─────────────────────────────
    steps_per_epoch = max(1, math.ceil(len(train_texts) / cfg.batch_size))
    total_steps = steps_per_epoch * cfg.epochs

    # ── TrainingArguments ─────────────────────────────────────────────────────
    training_args = TrainingArguments(
        output_dir=adapter_output_dir,
        num_train_epochs=cfg.epochs,
        per_device_train_batch_size=cfg.batch_size,
        per_device_eval_batch_size=max(1, cfg.batch_size // 2),
        gradient_accumulation_steps=max(1, 8 // cfg.batch_size),
        learning_rate=cfg.learning_rate,
        warmup_steps=cfg.warmup_steps,
        logging_steps=5,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=False,
        fp16=(device == "cuda" and not use_qlora),
        bf16=(device == "cuda" and use_qlora),
        optim="paged_adamw_32bit" if use_qlora else "adamw_torch",
        lr_scheduler_type="cosine",
        weight_decay=0.01,
        max_grad_norm=0.3,
        report_to="none",
        dataloader_num_workers=0,
        remove_unused_columns=True,
        group_by_length=True,
        ddp_find_unused_parameters=False,
    )

    # ── Progress callback ─────────────────────────────────────────────────────
    progress_callback = ProgressWebhookCallback(
        callback_url=req.callback_url,
        job_id=job_id,
        total_steps=total_steps,
        report_every_steps=10,
    )

    # ── SFTTrainer ────────────────────────────────────────────────────────────
    logger.info(f"[{job_id}] Initialising SFTTrainer…")
    trainer = SFTTrainer(
        model=model,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        peft_config=lora_config,
        max_seq_length=cfg.max_seq_length,
        tokenizer=tokenizer,
        dataset_text_field="text",
        packing=False,
        args=training_args,
        callbacks=[progress_callback],
    )

    # ── Train ─────────────────────────────────────────────────────────────────
    logger.info(f"[{job_id}] Starting training: {cfg.epochs} epochs, {total_steps} steps")
    trainer.train()

    # ── Save adapter ──────────────────────────────────────────────────────────
    logger.info(f"[{job_id}] Saving adapter to {adapter_output_dir}")
    trainer.model.save_pretrained(adapter_output_dir)
    tokenizer.save_pretrained(adapter_output_dir)

    # ── Update job status ─────────────────────────────────────────────────────
    with _JOBS_LOCK:
        _RUNNING_JOBS[job_id]["status"] = "completed"
        _RUNNING_JOBS[job_id]["adapter_path"] = adapter_output_dir

    logger.info(f"[{job_id}] Training completed. Adapter at: {adapter_output_dir}")

    _post_final_status(
        req.callback_url,
        job_id,
        "completed",
        adapter_path=adapter_output_dir,
        step=total_steps,
        total_steps=total_steps,
    )


# ── Route handler ─────────────────────────────────────────────────────────────

@router.post("/train", status_code=202, response_model=TrainStartResponse)
async def start_training(request: TrainRequest) -> TrainStartResponse:
    """
    Start a LoRA / QLoRA fine-tuning job in a background thread.

    Returns HTTP 202 immediately. Training progress is POSTed to callback_url.
    """
    job_id = request.job_id

    # Prevent duplicate jobs
    with _JOBS_LOCK:
        if job_id in _RUNNING_JOBS and _RUNNING_JOBS[job_id]["status"] == "running":
            raise HTTPException(
                status_code=409,
                detail=f"Job '{job_id}' is already running.",
            )

    # Validate dataset path exists
    dataset_path = request.dataset_path
    if not Path(dataset_path).is_absolute():
        dataset_path = str(Path(settings.upload_dir) / dataset_path)
    if not Path(dataset_path).exists():
        raise HTTPException(
            status_code=404,
            detail=f"Dataset not found: {request.dataset_path}",
        )

    # Register job
    with _JOBS_LOCK:
        _RUNNING_JOBS[job_id] = {
            "status": "pending",
            "thread": None,
            "error": None,
            "adapter_path": None,
        }

    # Start background thread
    thread = threading.Thread(
        target=_run_training,
        args=(request,),
        name=f"train-{job_id}",
        daemon=True,
    )
    with _JOBS_LOCK:
        _RUNNING_JOBS[job_id]["thread"] = thread
    thread.start()

    logger.info(f"Training job '{job_id}' started for model={request.hf_model_id}")
    return TrainStartResponse(
        job_id=job_id,
        status="started",
        message=f"Training started in background (model={request.hf_model_id}, "
                f"epochs={request.config.epochs})",
    )


@router.get("/train/{job_id}/status")
async def get_training_status(job_id: str) -> Dict[str, Any]:
    """
    Poll the in-memory status of a training job.
    For real-time updates, use the callback_url mechanism instead.
    """
    with _JOBS_LOCK:
        job = _RUNNING_JOBS.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    return {
        "job_id": job_id,
        "status": job["status"],
        "error": job.get("error"),
        "adapter_path": job.get("adapter_path"),
        "thread_alive": job["thread"].is_alive() if job.get("thread") else False,
    }
