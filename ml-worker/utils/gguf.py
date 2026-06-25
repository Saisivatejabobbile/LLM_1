"""
GGUF conversion helper using llama.cpp's convert_hf_to_gguf.py script.
"""

import logging
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Optional, Tuple

from config.settings import settings

logger = logging.getLogger(__name__)


def _find_convert_script() -> Optional[Path]:
    """
    Locate the llama.cpp convert script.
    Checks LLAMA_CPP_PATH env var first, then common locations.
    """
    candidates = [
        Path(settings.llama_cpp_path) / "convert_hf_to_gguf.py",
        Path(settings.llama_cpp_path) / "convert-hf-to-gguf.py",
        Path("/app/llama.cpp/convert_hf_to_gguf.py"),
        Path("/usr/local/bin/convert_hf_to_gguf.py"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def convert_to_gguf(
    merged_model_path: str,
    output_dir: str,
    model_name: str = "model",
    quant_type: str = "q4_k_m",
) -> Tuple[Optional[str], str, bool]:
    """
    Convert a merged HF model to GGUF format using llama.cpp.

    Args:
        merged_model_path: Path to merged HF model directory.
        output_dir:        Directory where GGUF file will be saved.
        model_name:        Base name for the GGUF file (without extension).
        quant_type:        Quantisation type (e.g., 'q4_k_m', 'q8_0', 'f16').

    Returns:
        (gguf_path, log_output, success)
        - gguf_path:   Absolute path to the GGUF file, or None if failed.
        - log_output:  stdout/stderr from the conversion process.
        - success:     True if conversion succeeded.
    """
    os.makedirs(output_dir, exist_ok=True)
    gguf_filename = f"{model_name}.{quant_type}.gguf"
    gguf_path = str(Path(output_dir) / gguf_filename)

    convert_script = _find_convert_script()
    if convert_script is None:
        msg = (
            "llama.cpp convert_hf_to_gguf.py not found. "
            f"Set LLAMA_CPP_PATH env var (currently: {settings.llama_cpp_path}). "
            "To manually convert, run: "
            f"python convert_hf_to_gguf.py {merged_model_path} "
            f"--outfile {gguf_path} --outtype {quant_type}"
        )
        logger.warning(msg)
        return None, msg, False

    cmd = [
        sys.executable,
        str(convert_script),
        merged_model_path,
        "--outfile", gguf_path,
        "--outtype", quant_type,
    ]

    logger.info(f"Running GGUF conversion: {' '.join(cmd)}")

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=3600,  # 1 hour max
            cwd=str(convert_script.parent),
        )
        log_output = result.stdout + "\n" + result.stderr

        if result.returncode != 0:
            logger.error(f"GGUF conversion failed (rc={result.returncode}):\n{log_output}")
            return None, log_output, False

        if not Path(gguf_path).exists():
            msg = f"Conversion reported success but GGUF file not found at {gguf_path}"
            logger.error(msg)
            return None, log_output + "\n" + msg, False

        logger.info(f"GGUF conversion succeeded: {gguf_path}")
        return gguf_path, log_output, True

    except subprocess.TimeoutExpired:
        msg = "GGUF conversion timed out after 1 hour."
        logger.error(msg)
        return None, msg, False
    except FileNotFoundError as exc:
        msg = f"Could not execute python interpreter: {exc}"
        logger.error(msg)
        return None, msg, False
    except Exception as exc:
        msg = f"Unexpected error during GGUF conversion: {exc}"
        logger.error(msg)
        return None, msg, False


def is_llama_cpp_available() -> bool:
    """Return True if llama.cpp conversion script is accessible."""
    return _find_convert_script() is not None
