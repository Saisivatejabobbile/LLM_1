"""
POST /deploy — Create Ollama model from GGUF and optionally push to Hugging Face Hub.
"""

import logging
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException

from config.settings import settings
from schemas.requests import DeployRequest
from schemas.responses import DeployResponse

logger = logging.getLogger(__name__)
router = APIRouter()


def _create_modelfile(
    gguf_path: str,
    system_prompt: str,
    temperature: float,
    top_p: float,
) -> str:
    """Generate the content of an Ollama Modelfile."""
    return (
        f"FROM {gguf_path}\n"
        f"SYSTEM {system_prompt}\n"
        f"PARAMETER temperature {temperature}\n"
        f"PARAMETER top_p {top_p}\n"
        f"PARAMETER stop \"<|im_end|>\"\n"
        f"PARAMETER stop \"</s>\"\n"
        f"PARAMETER stop \"<|eot_id|>\"\n"
        f"PARAMETER stop \"<|end|>\"\n"
    )


def _run_ollama_create(model_name: str, modelfile_path: str) -> tuple[bool, str]:
    """
    Run `ollama create {model_name} -f {modelfile_path}`.
    Returns (success, log_output).
    """
    try:
        result = subprocess.run(
            ["ollama", "create", model_name, "-f", modelfile_path],
            capture_output=True,
            text=True,
            timeout=300,  # 5 minutes
        )
        log_output = result.stdout + "\n" + result.stderr
        success = result.returncode == 0
        return success, log_output
    except FileNotFoundError:
        return False, "Ollama CLI not found. Install from https://ollama.com"
    except subprocess.TimeoutExpired:
        return False, "Ollama create command timed out after 5 minutes."
    except Exception as exc:
        return False, f"Ollama error: {exc}"


def _push_to_huggingface(
    gguf_path: str,
    hf_repo_id: str,
    hf_token: Optional[str],
) -> tuple[bool, Optional[str], str]:
    """
    Upload GGUF file to Hugging Face Hub.
    Returns (success, hf_url, log).
    """
    try:
        from huggingface_hub import HfApi

        token = hf_token or settings.hf_token or None
        api = HfApi(token=token)

        gguf_filename = Path(gguf_path).name

        # Create repo if it doesn't exist
        try:
            api.create_repo(
                repo_id=hf_repo_id,
                repo_type="model",
                exist_ok=True,
                private=False,
            )
        except Exception as exc:
            logger.warning(f"Could not create HF repo (may already exist): {exc}")

        # Upload the GGUF file
        url = api.upload_file(
            path_or_fileobj=gguf_path,
            path_in_repo=gguf_filename,
            repo_id=hf_repo_id,
            repo_type="model",
        )
        hf_url = f"https://huggingface.co/{hf_repo_id}"
        logger.info(f"Uploaded GGUF to HF: {hf_url}")
        return True, hf_url, f"Uploaded to {hf_url}"

    except ImportError:
        return False, None, "huggingface_hub not installed."
    except Exception as exc:
        return False, None, f"HF upload failed: {exc}"


# ── Route handler ─────────────────────────────────────────────────────────────

@router.post("/deploy", response_model=DeployResponse)
async def deploy_model(request: DeployRequest) -> DeployResponse:
    """
    Deploy a GGUF model to Ollama and/or push it to Hugging Face Hub.

    Steps:
    1. Validate GGUF file exists.
    2. Write an Ollama Modelfile with system prompt and parameters.
    3. Run `ollama create {model_name} -f {modelfile}`.
    4. If push_to_hf=True, upload GGUF to Hugging Face Hub.
    """
    job_id = request.job_id
    logger.info(f"[{job_id}] Deploy requested: model_name={request.model_name}, gguf={request.gguf_path}")

    # ── Validate GGUF path ─────────────────────────────────────────────────────
    gguf_path = Path(request.gguf_path)
    if not gguf_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"GGUF file not found: {request.gguf_path}",
        )

    # ── Create Ollama Modelfile ────────────────────────────────────────────────
    system_prompt = request.system_prompt or "You are a helpful assistant fine-tuned on specialized domain data."
    modelfile_content = _create_modelfile(
        gguf_path=str(gguf_path.resolve()),
        system_prompt=system_prompt,
        temperature=request.temperature,
        top_p=request.top_p,
    )

    # Write Modelfile to models dir (persistent) instead of tmp
    modelfile_dir = Path(settings.models_dir) / request.project_id / "ollama"
    os.makedirs(str(modelfile_dir), exist_ok=True)
    modelfile_path = str(modelfile_dir / "Modelfile")

    with open(modelfile_path, "w", encoding="utf-8") as fh:
        fh.write(modelfile_content)

    logger.info(f"[{job_id}] Modelfile written to: {modelfile_path}")
    logger.debug(f"[{job_id}] Modelfile content:\n{modelfile_content}")

    # ── Run ollama create ──────────────────────────────────────────────────────
    ollama_success, ollama_log = _run_ollama_create(request.model_name, modelfile_path)
    ollama_available = ollama_success

    if ollama_success:
        logger.info(f"[{job_id}] Ollama model '{request.model_name}' created successfully.")
    else:
        logger.warning(f"[{job_id}] Ollama creation failed or unavailable: {ollama_log[:200]}")

    # ── Optionally push to HF ──────────────────────────────────────────────────
    hf_url: Optional[str] = None
    hf_pushed = False

    if request.push_to_hf:
        if not request.hf_repo_id:
            logger.warning(f"[{job_id}] push_to_hf=True but hf_repo_id not provided. Skipping.")
        else:
            logger.info(f"[{job_id}] Pushing GGUF to HF Hub: {request.hf_repo_id}")
            hf_pushed, hf_url, hf_log = _push_to_huggingface(
                gguf_path=str(gguf_path),
                hf_repo_id=request.hf_repo_id,
                hf_token=settings.hf_token or None,
            )
            if hf_pushed:
                logger.info(f"[{job_id}] HF push successful: {hf_url}")
            else:
                logger.warning(f"[{job_id}] HF push failed: {hf_log}")

    # ── Build message ──────────────────────────────────────────────────────────
    parts = []
    if ollama_available:
        parts.append(f"Ollama model '{request.model_name}' is ready. Run: ollama run {request.model_name}")
    else:
        parts.append(f"Ollama deployment failed: {ollama_log[:300]}")
    if hf_pushed and hf_url:
        parts.append(f"Model pushed to HF: {hf_url}")
    elif request.push_to_hf and not hf_pushed:
        parts.append("HF push failed — check hf_repo_id and HF_TOKEN.")

    message = " | ".join(parts)

    return DeployResponse(
        job_id=job_id,
        status="completed",
        ollama_model=request.model_name if ollama_available else None,
        ollama_available=ollama_available,
        hf_url=hf_url,
        hf_pushed=hf_pushed,
        modelfile_path=modelfile_path,
        message=message,
    )
