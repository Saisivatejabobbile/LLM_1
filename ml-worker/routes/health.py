"""
GET /health — liveness / readiness check.
"""

from fastapi import APIRouter

from schemas.responses import HealthResponse
from utils.hardware import get_hardware_info

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Return service liveness status plus current hardware info.
    Always returns HTTP 200 (if the service is down, you won't reach this).
    """
    try:
        hw = get_hardware_info()
    except Exception:
        hw = {}
    return HealthResponse(status="ok", hardware=hw)
