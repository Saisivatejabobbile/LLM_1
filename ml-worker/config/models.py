"""
Base model configurations for SLM Forge ML Worker.
All model metadata is centralised here — never hardcoded in route handlers.
"""

from typing import Any

BASE_MODELS: dict[str, dict[str, Any]] = {
    "phi-3-mini": {
        "name": "Phi-3 Mini 4K Instruct",
        "hf_model_id": "microsoft/Phi-3-mini-4k-instruct",
        "param_count": "3.8B",
        "max_vram_gb": 8,
        "target_modules": [
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj",
        ],
        "chat_template": "phi3",
    },
    "gemma-2-2b": {
        "name": "Gemma 2 2B Instruct",
        "hf_model_id": "google/gemma-2-2b-it",
        "param_count": "2B",
        "max_vram_gb": 6,
        "target_modules": [
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj",
        ],
        "chat_template": "gemma",
    },
    "llama-3.2-3b": {
        "name": "Llama 3.2 3B Instruct",
        "hf_model_id": "meta-llama/Llama-3.2-3B-Instruct",
        "param_count": "3B",
        "max_vram_gb": 8,
        "target_modules": [
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj",
        ],
        "chat_template": "llama3",
    },
    "mistral-7b": {
        "name": "Mistral 7B Instruct v0.3",
        "hf_model_id": "mistralai/Mistral-7B-Instruct-v0.3",
        "param_count": "7B",
        "max_vram_gb": 16,
        "target_modules": [
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj",
        ],
        "chat_template": "mistral",
    },
    "qwen2.5-3b": {
        "name": "Qwen2.5 3B Instruct",
        "hf_model_id": "Qwen/Qwen2.5-3B-Instruct",
        "param_count": "3B",
        "max_vram_gb": 8,
        "target_modules": [
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj",
        ],
        "chat_template": "chatml",
    },
}


def get_model_config(model_key: str) -> dict[str, Any]:
    """Return config for a given base model key; raise KeyError if unknown."""
    if model_key not in BASE_MODELS:
        raise KeyError(
            f"Unknown base_model_id '{model_key}'. "
            f"Available: {list(BASE_MODELS.keys())}"
        )
    return BASE_MODELS[model_key]


def get_hf_model_id(model_key: str) -> str:
    """Resolve a base_model_id key to its Hugging Face model ID."""
    return get_model_config(model_key)["hf_model_id"]


def get_target_modules(model_key: str) -> list[str]:
    """Return the LoRA target modules for a given base model."""
    return get_model_config(model_key)["target_modules"]


def get_chat_template_name(model_key: str) -> str:
    """Return the chat template identifier for a given base model."""
    return get_model_config(model_key)["chat_template"]
