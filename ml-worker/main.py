"""
SLM Forge ML Worker — FastAPI Application Entry Point
"""

import logging
import os
from contextlib import asynccontextmanager

import nltk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config.settings import settings
from routes.health import router as health_router
from routes.hardware import router as hardware_router
from routes.format_dataset import router as format_dataset_router
from routes.train import router as train_router
from routes.export import router as export_router
from routes.evaluate import router as evaluate_router
from routes.deploy import router as deploy_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("slm_forge")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler — startup & shutdown logic."""
    # ── Startup ──────────────────────────────────────────────────────────────
    logger.info("SLM Forge ML Worker starting up…")

    # Ensure required directories exist
    for directory in [settings.upload_dir, settings.models_dir, settings.hf_home]:
        os.makedirs(directory, exist_ok=True)
        logger.info(f"Ensured directory exists: {directory}")

    # Download NLTK data required for BLEU scoring
    try:
        nltk.download("punkt", quiet=True)
        nltk.download("punkt_tab", quiet=True)
        logger.info("NLTK punkt tokenizer downloaded.")
    except Exception as exc:
        logger.warning(f"Could not download NLTK data: {exc}")

    # Log hardware info at startup
    try:
        from utils.hardware import get_hardware_info
        hw = get_hardware_info()
        logger.info(
            f"Hardware: device={hw['device']}, "
            f"gpu={hw.get('gpu_name', 'none')}, "
            f"vram_free={hw.get('vram_free_gb')} GB, "
            f"ram_free={hw.get('ram_free_gb'):.1f} GB"
        )
    except Exception as exc:
        logger.warning(f"Hardware detection failed at startup: {exc}")

    logger.info(f"Upload dir  : {settings.upload_dir}")
    logger.info(f"Models dir  : {settings.models_dir}")
    logger.info(f"HF cache    : {settings.hf_home}")
    logger.info("SLM Forge ML Worker is ready.")

    yield

    # ── Shutdown ─────────────────────────────────────────────────────────────
    logger.info("SLM Forge ML Worker shutting down…")


# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="SLM Forge ML Worker",
    description=(
        "FastAPI-based ML worker for fine-tuning small language models (SLMs) "
        "using LoRA / QLoRA, with export to GGUF and one-click Ollama deployment."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow the SLM Forge backend to call this worker
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global exception handler ──────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )


# ── Route registration ────────────────────────────────────────────────────────

app.include_router(health_router, tags=["Health"])
app.include_router(hardware_router, tags=["Hardware"])
app.include_router(format_dataset_router, tags=["Dataset"])
app.include_router(train_router, tags=["Training"])
app.include_router(export_router, tags=["Export"])
app.include_router(evaluate_router, tags=["Evaluate"])
app.include_router(deploy_router, tags=["Deploy"])


# ── Root redirect ─────────────────────────────────────────────────────────────

@app.get("/", include_in_schema=False)
async def root():
    return {"message": "SLM Forge ML Worker", "docs": "/docs", "health": "/health"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        workers=1,
        timeout_keep_alive=300,
        log_level="info",
    )
