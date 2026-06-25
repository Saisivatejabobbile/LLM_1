"""
POST /export — Merge LoRA adapter with base model and convert to GGUF.
"""

import gc
import logging
import os
from pathlib import Path
from typing import Any, Dict

import torch
from fastapi import APIRouter, HTTPException

from config.settings import settings
from schemas.requests import ExportRequest
from schemas.responses import ExportResponse
from utils.gguf import convert_to_gguf, is_llama_cpp_available

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/export", response_model=ExportResponse)
async def export_model(request: ExportRequest) -> ExportResponse:
    """
    1. Load the base model + LoRA adapter.
    2. Merge adapter weights into the base model (merge_and_unload).
    3. Save the merged model in HuggingFace format.
    4. Convert to GGUF via llama.cpp (q4_k_m quantisation).

    If llama.cpp is not available, returns the merged HF model path and
    provides manual conversion instructions.
    """
    job_id = request.job_id
    logger.info(f"[{job_id}] Export requested: adapter={request.adapter_path}, model={request.hf_model_id}")

    # ── Validate adapter path ──────────────────────────────────────────────────
    adapter_path = Path(request.adapter_path)
    if not adapter_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Adapter path not found: {request.adapter_path}",
        )

    # ── Output paths ──────────────────────────────────────────────────────────
    merged_dir = Path(settings.models_dir) / request.project_id / "merged"
    gguf_dir = Path(settings.models_dir) / request.project_id / "gguf"
    os.makedirs(str(merged_dir), exist_ok=True)
    os.makedirs(str(gguf_dir), exist_ok=True)

    # ── Determine device / dtype ───────────────────────────────────────────────
    cuda_available = torch.cuda.is_available()
    mps_available = hasattr(torch.backends, "mps") and torch.backends.mps.is_available()

    if cuda_available:
        compute_dtype = torch.bfloat16
        device_map: Any = "auto"
    elif mps_available:
        compute_dtype = torch.float16
        device_map = "mps"
    else:
        compute_dtype = torch.float32
        device_map = "cpu"

    try:
        from peft import PeftModel
        from transformers import AutoModelForCausalLM, AutoTokenizer

        # ── Load tokenizer ─────────────────────────────────────────────────────
        logger.info(f"[{job_id}] Loading tokenizer: {request.hf_model_id}")
        tokenizer = AutoTokenizer.from_pretrained(
            request.hf_model_id,
            trust_remote_code=True,
        )

        # ── Load base model (full precision for merging) ───────────────────────
        logger.info(f"[{job_id}] Loading base model for merge: {request.hf_model_id}")
        base_model = AutoModelForCausalLM.from_pretrained(
            request.hf_model_id,
            torch_dtype=compute_dtype,
            device_map=device_map,
            trust_remote_code=True,
            use_cache=True,
        )

        # ── Load PEFT adapter ──────────────────────────────────────────────────
        logger.info(f"[{job_id}] Loading PEFT adapter from: {adapter_path}")
        peft_model = PeftModel.from_pretrained(
            base_model,
            str(adapter_path),
            torch_dtype=compute_dtype,
        )

        # ── Merge adapter into base model ─────────────────────────────────────
        logger.info(f"[{job_id}] Merging adapter weights…")
        merged_model = peft_model.merge_and_unload()
        merged_model.eval()

        # ── Save merged model ──────────────────────────────────────────────────
        logger.info(f"[{job_id}] Saving merged model to: {merged_dir}")
        merged_model.save_pretrained(str(merged_dir), safe_serialization=True)
        tokenizer.save_pretrained(str(merged_dir))
        logger.info(f"[{job_id}] Merged model saved successfully.")

    except Exception as exc:
        logger.error(f"[{job_id}] Model merge failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Model merge failed: {exc}") from exc
    finally:
        # Release GPU memory after merge
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

    # ── GGUF Conversion ────────────────────────────────────────────────────────
    gguf_path: str | None = None
    conversion_log = ""
    gguf_available = False

    if is_llama_cpp_available():
        logger.info(f"[{job_id}] Starting GGUF conversion…")
        model_name = f"{request.project_id}-finetuned"
        gguf_path, conversion_log, success = convert_to_gguf(
            merged_model_path=str(merged_dir),
            output_dir=str(gguf_dir),
            model_name=model_name,
            quant_type="q4_k_m",
        )
        gguf_available = success
        if success:
            logger.info(f"[{job_id}] GGUF conversion successful: {gguf_path}")
        else:
            logger.warning(f"[{job_id}] GGUF conversion failed. Merged model is still available.")
    else:
        conversion_log = (
            "llama.cpp not found. To convert manually:\n"
            f"  git clone https://github.com/ggerganov/llama.cpp\n"
            f"  cd llama.cpp && pip install -r requirements.txt\n"
            f"  python convert_hf_to_gguf.py {merged_dir} "
            f"--outfile {gguf_dir}/{request.project_id}-finetuned.q4_k_m.gguf "
            f"--outtype q4_k_m\n"
            f"Set LLAMA_CPP_PATH env var to your llama.cpp directory."
        )
        logger.info(f"[{job_id}] llama.cpp not available — returning merged HF model only.")

    message = "Export completed." if gguf_available else (
        "Merged model saved. GGUF conversion was skipped — "
        "see conversion_log for manual instructions."
    )

    return ExportResponse(
        job_id=job_id,
        status="completed",
        merged_path=str(merged_dir),
        gguf_path=gguf_path,
        gguf_available=gguf_available,
        message=message,
        conversion_log=conversion_log,
    )
