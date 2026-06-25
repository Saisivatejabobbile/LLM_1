"""
POST /evaluate — BLEU and ROUGE evaluation of fine-tuned vs base model.

Loads base model and fine-tuned model sequentially (to avoid OOM),
generates responses on a held-out test set, and computes metrics.
"""

import gc
import logging
import math
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import torch
from fastapi import APIRouter, HTTPException

from config.models import BASE_MODELS
from config.settings import settings
from schemas.requests import EvaluateRequest
from schemas.responses import EvaluateResponse, EvaluationComparison
from utils.chat_templates import format_inference_prompt
from utils.dataset import load_jsonl_dataset
from utils.hardware import get_hardware_info

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Inference helper ──────────────────────────────────────────────────────────

def _generate_responses(
    model: Any,
    tokenizer: Any,
    prompts: List[str],
    max_new_tokens: int,
    device: str,
) -> List[str]:
    """Generate one response per prompt using greedy decoding."""
    responses: List[str] = []
    model.eval()

    with torch.no_grad():
        for prompt in prompts:
            inputs = tokenizer(
                prompt,
                return_tensors="pt",
                truncation=True,
                max_length=1024,
            )
            # Move inputs to correct device
            if device == "cuda":
                inputs = {k: v.cuda() for k, v in inputs.items()}
            elif device == "mps":
                inputs = {k: v.to("mps") for k, v in inputs.items()}

            try:
                outputs = model.generate(
                    **inputs,
                    max_new_tokens=max_new_tokens,
                    do_sample=False,        # greedy for reproducibility
                    temperature=1.0,
                    pad_token_id=tokenizer.eos_token_id,
                    eos_token_id=tokenizer.eos_token_id,
                )
                # Decode only the newly generated tokens
                generated_ids = outputs[0][inputs["input_ids"].shape[-1]:]
                text = tokenizer.decode(generated_ids, skip_special_tokens=True).strip()
            except Exception as exc:
                logger.warning(f"Generation error: {exc}")
                text = ""

            responses.append(text)

    return responses


def _load_model_for_inference(
    hf_model_id: str,
    adapter_path: Optional[str],
    device: str,
) -> tuple[Any, Any]:
    """
    Load model (optionally with PEFT adapter) for inference.
    Uses 4-bit quantisation on CUDA to reduce VRAM usage.
    """
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

    tokenizer = AutoTokenizer.from_pretrained(hf_model_id, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model_kwargs: Dict[str, Any] = {"trust_remote_code": True}

    if device == "cuda":
        # Use 4-bit to fit two models in sequence without OOM
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16,
        )
        model_kwargs["quantization_config"] = bnb_config
        model_kwargs["device_map"] = "auto"
    elif device == "mps":
        model_kwargs["torch_dtype"] = torch.float16
        model_kwargs["device_map"] = "mps"
    else:
        model_kwargs["torch_dtype"] = torch.float32
        model_kwargs["device_map"] = "cpu"

    model = AutoModelForCausalLM.from_pretrained(hf_model_id, **model_kwargs)

    if adapter_path:
        from peft import PeftModel
        model = PeftModel.from_pretrained(model, adapter_path)

    return model, tokenizer


def _unload_model(model: Any) -> None:
    """Explicitly unload model from GPU memory."""
    del model
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()


# ── Metric computation ────────────────────────────────────────────────────────

def _compute_bleu(predictions: List[str], references: List[str]) -> tuple[float, List[float]]:
    """Compute corpus-level and per-example BLEU scores."""
    try:
        import evaluate as hf_evaluate
        bleu_metric = hf_evaluate.load("bleu")

        # Per-example scores
        per_example: List[float] = []
        for pred, ref in zip(predictions, references):
            try:
                result = bleu_metric.compute(
                    predictions=[pred],
                    references=[[ref]],
                )
                per_example.append(result.get("bleu", 0.0) or 0.0)
            except Exception:
                per_example.append(0.0)

        # Corpus-level
        try:
            corpus_result = bleu_metric.compute(
                predictions=predictions,
                references=[[r] for r in references],
            )
            corpus_bleu = corpus_result.get("bleu", 0.0) or 0.0
        except Exception:
            corpus_bleu = sum(per_example) / max(len(per_example), 1)

        return corpus_bleu, per_example

    except Exception as exc:
        logger.warning(f"BLEU computation failed: {exc}")
        return 0.0, [0.0] * len(predictions)


def _compute_rouge(
    predictions: List[str],
    references: List[str],
) -> tuple[float, float, float, List[float]]:
    """Compute corpus-level ROUGE-1, ROUGE-2, ROUGE-L and per-example ROUGE-L."""
    try:
        import evaluate as hf_evaluate
        rouge_metric = hf_evaluate.load("rouge")

        corpus_result = rouge_metric.compute(
            predictions=predictions,
            references=references,
            use_aggregator=True,
        )
        rouge1 = corpus_result.get("rouge1", 0.0) or 0.0
        rouge2 = corpus_result.get("rouge2", 0.0) or 0.0
        rougeL = corpus_result.get("rougeL", 0.0) or 0.0

        # Per-example ROUGE-L
        per_example: List[float] = []
        for pred, ref in zip(predictions, references):
            try:
                r = rouge_metric.compute(
                    predictions=[pred],
                    references=[ref],
                    use_aggregator=True,
                )
                per_example.append(r.get("rougeL", 0.0) or 0.0)
            except Exception:
                per_example.append(0.0)

        return rouge1, rouge2, rougeL, per_example

    except Exception as exc:
        logger.warning(f"ROUGE computation failed: {exc}")
        return 0.0, 0.0, 0.0, [0.0] * len(predictions)


# ── Route handler ─────────────────────────────────────────────────────────────

@router.post("/evaluate", response_model=EvaluateResponse)
async def evaluate_model(request: EvaluateRequest) -> EvaluateResponse:
    """
    Evaluate a fine-tuned model against the base model using BLEU and ROUGE metrics.

    Process:
    1. Load dataset — use last 20% as held-out test set.
    2. Load BASE model → generate responses → unload.
    3. Load FINE-TUNED model (base + adapter) → generate responses.
    4. Compute BLEU and ROUGE-L scores.
    5. Return aggregated metrics + per-sample comparisons.
    """
    job_id = request.job_id
    logger.info(f"[{job_id}] Evaluation requested: model={request.hf_model_id}")

    # ── Validate adapter path ──────────────────────────────────────────────────
    adapter_path = Path(request.adapter_path)
    if not adapter_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Adapter path not found: {request.adapter_path}",
        )

    # ── Load dataset ───────────────────────────────────────────────────────────
    dataset_path = request.dataset_path
    if not Path(dataset_path).is_absolute():
        dataset_path = str(Path(settings.upload_dir) / dataset_path)
    if not Path(dataset_path).exists():
        raise HTTPException(
            status_code=404,
            detail=f"Dataset not found: {request.dataset_path}",
        )

    raw_rows = load_jsonl_dataset(dataset_path)
    if not raw_rows:
        raise HTTPException(status_code=422, detail="Dataset is empty.")

    # Last 20% as test set
    split_idx = max(1, int(len(raw_rows) * (1.0 - settings.eval_test_split)))
    test_rows = raw_rows[split_idx:]
    if not test_rows:
        test_rows = raw_rows  # Fallback: evaluate on all if dataset is tiny

    # Cap samples to avoid OOM / very long eval times
    test_rows = test_rows[: settings.eval_max_samples]
    logger.info(f"[{job_id}] Evaluating on {len(test_rows)} test samples")

    # ── Determine chat template ────────────────────────────────────────────────
    template_name = "alpaca"
    if request.base_model_id in BASE_MODELS:
        template_name = BASE_MODELS[request.base_model_id].get("chat_template", "alpaca")

    prompts = [
        format_inference_prompt(
            instruction=row.get("instruction", ""),
            input_text=row.get("input", ""),
            template_name=template_name,
        )
        for row in test_rows
    ]
    references = [row.get("output", "") for row in test_rows]

    # ── Detect device ──────────────────────────────────────────────────────────
    hw = get_hardware_info()
    device = hw["device"]

    # ── Generate with BASE model ───────────────────────────────────────────────
    logger.info(f"[{job_id}] Loading base model for inference…")
    try:
        base_model, tokenizer = _load_model_for_inference(
            hf_model_id=request.hf_model_id,
            adapter_path=None,
            device=device,
        )
        base_outputs = _generate_responses(
            model=base_model,
            tokenizer=tokenizer,
            prompts=prompts,
            max_new_tokens=settings.eval_max_new_tokens,
            device=device,
        )
    except Exception as exc:
        logger.error(f"[{job_id}] Base model generation failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Base model inference failed: {exc}") from exc
    finally:
        _unload_model(base_model)

    # ── Generate with FINE-TUNED model ────────────────────────────────────────
    logger.info(f"[{job_id}] Loading fine-tuned model for inference…")
    try:
        finetuned_model, tokenizer = _load_model_for_inference(
            hf_model_id=request.hf_model_id,
            adapter_path=str(adapter_path),
            device=device,
        )
        finetuned_outputs = _generate_responses(
            model=finetuned_model,
            tokenizer=tokenizer,
            prompts=prompts,
            max_new_tokens=settings.eval_max_new_tokens,
            device=device,
        )
    except Exception as exc:
        logger.error(f"[{job_id}] Fine-tuned model generation failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Fine-tuned model inference failed: {exc}",
        ) from exc
    finally:
        _unload_model(finetuned_model)

    # ── Compute BLEU ───────────────────────────────────────────────────────────
    logger.info(f"[{job_id}] Computing BLEU and ROUGE scores…")
    corpus_bleu, per_bleu = _compute_bleu(finetuned_outputs, references)
    rouge1, rouge2, rougeL, per_rougeL = _compute_rouge(finetuned_outputs, references)

    # ── Build per-sample comparisons ───────────────────────────────────────────
    comparisons: List[EvaluationComparison] = []
    for i, row in enumerate(test_rows):
        comparisons.append(
            EvaluationComparison(
                instruction=row.get("instruction", ""),
                input=row.get("input", ""),
                reference=references[i],
                base_output=base_outputs[i] if i < len(base_outputs) else "",
                finetuned_output=finetuned_outputs[i] if i < len(finetuned_outputs) else "",
                bleu=round(per_bleu[i] if i < len(per_bleu) else 0.0, 4),
                rouge_l=round(per_rougeL[i] if i < len(per_rougeL) else 0.0, 4),
            )
        )

    logger.info(
        f"[{job_id}] Evaluation complete: BLEU={corpus_bleu:.4f}, "
        f"ROUGE-1={rouge1:.4f}, ROUGE-2={rouge2:.4f}, ROUGE-L={rougeL:.4f}"
    )

    return EvaluateResponse(
        job_id=job_id,
        bleu_score=round(corpus_bleu, 4),
        rouge_1=round(rouge1, 4),
        rouge_2=round(rouge2, 4),
        rouge_l=round(rougeL, 4),
        num_samples=len(test_rows),
        comparisons=comparisons,
    )
