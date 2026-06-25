"""
Hardware detection utilities — CUDA / MPS / CPU, VRAM, RAM.
"""

import logging
from typing import Any, Dict, List, Optional

import psutil
import torch

logger = logging.getLogger(__name__)


def _get_vram_info() -> tuple[Optional[float], Optional[float], Optional[float], Optional[str]]:
    """
    Return (vram_total_gb, vram_free_gb, vram_used_gb, gpu_name).
    Uses torch CUDA APIs first, falls back to GPUtil.
    """
    if torch.cuda.is_available():
        try:
            device_index = torch.cuda.current_device()
            gpu_name = torch.cuda.get_device_name(device_index)
            mem = torch.cuda.mem_get_info(device_index)          # (free, total) in bytes
            vram_free_gb = round(mem[0] / (1024 ** 3), 2)
            vram_total_gb = round(mem[1] / (1024 ** 3), 2)
            vram_used_gb = round((mem[1] - mem[0]) / (1024 ** 3), 2)
            return vram_total_gb, vram_free_gb, vram_used_gb, gpu_name
        except Exception as exc:
            logger.warning(f"torch CUDA VRAM query failed: {exc}, trying GPUtil")
            try:
                import GPUtil  # type: ignore
                gpus = GPUtil.getGPUs()
                if gpus:
                    gpu = gpus[0]
                    return (
                        round(gpu.memoryTotal / 1024, 2),
                        round(gpu.memoryFree / 1024, 2),
                        round(gpu.memoryUsed / 1024, 2),
                        gpu.name,
                    )
            except Exception as exc2:
                logger.warning(f"GPUtil also failed: {exc2}")

    return None, None, None, None


def get_hardware_info() -> Dict[str, Any]:
    """
    Detect available hardware and return a structured dict.
    """
    cuda_available = torch.cuda.is_available()
    mps_available = (
        hasattr(torch.backends, "mps") and torch.backends.mps.is_available()
    )

    if cuda_available:
        device = "cuda"
    elif mps_available:
        device = "mps"
    else:
        device = "cpu"

    # RAM
    vm = psutil.virtual_memory()
    ram_total_gb = round(vm.total / (1024 ** 3), 2)
    ram_free_gb = round(vm.available / (1024 ** 3), 2)
    ram_used_gb = round(vm.used / (1024 ** 3), 2)

    # CPU
    cpu_count = psutil.cpu_count(logical=True) or 1

    # VRAM (CUDA only)
    vram_total_gb, vram_free_gb, vram_used_gb, gpu_name = _get_vram_info()

    # MPS fallback (Apple Silicon — no VRAM API)
    if mps_available and not cuda_available:
        gpu_name = "Apple Silicon MPS"

    # Build warnings
    warnings: List[str] = []
    from config.models import BASE_MODELS
    if vram_free_gb is not None:
        for key, cfg in BASE_MODELS.items():
            req = cfg["max_vram_gb"]
            if vram_free_gb < req:
                warnings.append(
                    f"Only {vram_free_gb} GB VRAM free; "
                    f"{cfg['name']} requires {req} GB"
                )
    elif device == "cpu":
        warnings.append(
            "No GPU detected — training will run on CPU and may be very slow."
        )

    return {
        "device": device,
        "cuda_available": cuda_available,
        "mps_available": mps_available,
        "gpu_name": gpu_name,
        "vram_total_gb": vram_total_gb,
        "vram_free_gb": vram_free_gb,
        "vram_used_gb": vram_used_gb,
        "ram_total_gb": ram_total_gb,
        "ram_free_gb": ram_free_gb,
        "ram_used_gb": ram_used_gb,
        "cpu_count": cpu_count,
        "warnings": warnings,
    }
