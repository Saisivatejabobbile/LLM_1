"""
Application settings loaded from environment variables via pydantic-settings.
"""

import os
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Directories ───────────────────────────────────────────────────────────
    upload_dir: str = os.environ.get("UPLOAD_DIR", "/app/uploads")
    models_dir: str = os.environ.get("MODELS_DIR", "/app/models")
    hf_home: str = os.environ.get("HF_HOME", "/app/hf_cache")

    # ── llama.cpp ─────────────────────────────────────────────────────────────
    llama_cpp_path: str = os.environ.get("LLAMA_CPP_PATH", "/app/llama.cpp")

    # ── Hugging Face ──────────────────────────────────────────────────────────
    hf_token: str = os.environ.get("HF_TOKEN", "")

    # ── Server ────────────────────────────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 1

    # ── CORS ──────────────────────────────────────────────────────────────────
    cors_origins: List[str] = ["*"]

    # ── Training defaults ─────────────────────────────────────────────────────
    default_max_seq_length: int = 2048
    default_batch_size: int = 2
    default_epochs: int = 3
    default_learning_rate: float = 2e-4
    default_lora_rank: int = 16
    default_lora_alpha: int = 32
    default_lora_dropout: float = 0.05

    # ── Evaluation ────────────────────────────────────────────────────────────
    eval_test_split: float = 0.2  # 20% held out for evaluation
    eval_max_new_tokens: int = 256
    eval_max_samples: int = 50    # cap to avoid OOM during evaluation

    # ── Ollama ────────────────────────────────────────────────────────────────
    ollama_base_url: str = "http://localhost:11434"

    # ── Misc ──────────────────────────────────────────────────────────────────
    log_level: str = "INFO"
    callback_timeout_seconds: int = 5


# Singleton instance used across the application
settings = Settings()

# Push HF_HOME into env so transformers/datasets pick it up
os.environ.setdefault("HF_HOME", settings.hf_home)
os.environ.setdefault("TRANSFORMERS_CACHE", settings.hf_home)
