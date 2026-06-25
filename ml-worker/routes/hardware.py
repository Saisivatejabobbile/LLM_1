"""
GET /hardware — detailed hardware information.
"""

from fastapi import APIRouter, HTTPException

from schemas.responses import HardwareResponse
from utils.hardware import get_hardware_info

router = APIRouter()


@router.get("/hardware", response_model=HardwareResponse)
async def hardware_info() -> HardwareResponse:
    """
    Return detailed hardware information including GPU, VRAM, and RAM stats.
    Includes warnings if free VRAM is insufficient for any supported base model.
    """
    try:
        hw = get_hardware_info()
        return HardwareResponse(**hw)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Hardware detection failed: {exc}") from exc
