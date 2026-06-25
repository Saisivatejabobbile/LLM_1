"""
Pydantic v2 request models for all SLM Forge ML Worker endpoints.
"""

from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


# ── /format-dataset ───────────────────────────────────────────────────────────

class FormatDatasetRequest(BaseModel):
    file_path: str = Field(..., description="Relative path under UPLOAD_DIR")
    project_id: str = Field(..., description="Project identifier")
    file_type: str = Field(..., description="File type: 'txt', 'pdf', 'jsonl', 'json', 'csv'")

    @field_validator("file_type")
    @classmethod
    def validate_file_type(cls, v: str) -> str:
        allowed = {"txt", "pdf", "jsonl", "json", "csv"}
        if v.lower() not in allowed:
            raise ValueError(f"file_type must be one of {allowed}")
        return v.lower()


# ── /train ────────────────────────────────────────────────────────────────────

class TrainConfig(BaseModel):
    epochs: int = Field(default=3, ge=1, le=100)
    learning_rate: float = Field(default=2e-4, gt=0)
    lora_rank: int = Field(default=16, ge=1, le=256)
    lora_alpha: int = Field(default=32, ge=1)
    lora_dropout: float = Field(default=0.05, ge=0.0, le=1.0)
    batch_size: int = Field(default=2, ge=1, le=64)
    warmup_steps: int = Field(default=10, ge=0)
    max_seq_length: int = Field(default=2048, ge=64, le=32768)
    use_qlora: bool = Field(default=True, description="Use 4-bit QLoRA (requires CUDA)")


class TrainRequest(BaseModel):
    job_id: str = Field(..., description="Unique job identifier")
    project_id: str = Field(..., description="Project identifier")
    dataset_path: str = Field(..., description="Path to JSONL dataset file (relative to UPLOAD_DIR or absolute)")
    base_model_id: str = Field(..., description="Key from BASE_MODELS config")
    hf_model_id: str = Field(..., description="Hugging Face model ID (overrides base_model_id lookup)")
    output_dir: str = Field(..., description="Output directory for adapter checkpoints")
    config: TrainConfig = Field(default_factory=TrainConfig)
    callback_url: str = Field(..., description="URL to POST progress updates to")
    target_modules: List[str] = Field(
        default_factory=lambda: [
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj",
        ]
    )


# ── /export ───────────────────────────────────────────────────────────────────

class ExportRequest(BaseModel):
    job_id: str = Field(..., description="Unique job identifier")
    project_id: str = Field(..., description="Project identifier")
    adapter_path: str = Field(..., description="Path to LoRA adapter directory")
    output_dir: str = Field(..., description="Output directory for exported files")
    base_model_id: str = Field(..., description="Key from BASE_MODELS config")
    hf_model_id: str = Field(..., description="Hugging Face model ID of the base model")


# ── /evaluate ─────────────────────────────────────────────────────────────────

class EvaluateRequest(BaseModel):
    job_id: str = Field(..., description="Unique job identifier")
    project_id: str = Field(..., description="Project identifier")
    dataset_path: str = Field(..., description="Path to JSONL evaluation dataset")
    base_model_id: str = Field(..., description="Key from BASE_MODELS config")
    hf_model_id: str = Field(..., description="Hugging Face model ID of the base model")
    adapter_path: str = Field(..., description="Path to fine-tuned LoRA adapter directory")


# ── /deploy ───────────────────────────────────────────────────────────────────

class DeployRequest(BaseModel):
    job_id: str = Field(..., description="Unique job identifier")
    project_id: str = Field(..., description="Project identifier")
    gguf_path: str = Field(..., description="Absolute path to the GGUF model file")
    model_name: str = Field(..., description="Ollama model name (e.g. 'my-finetuned-model')")
    push_to_hf: bool = Field(default=False, description="Push GGUF to Hugging Face Hub")
    hf_repo_id: Optional[str] = Field(
        default=None,
        description="HF repo id for push (e.g. 'username/model-name')",
    )
    system_prompt: Optional[str] = Field(
        default="You are a helpful assistant fine-tuned on specialized domain data.",
        description="System prompt baked into the Ollama Modelfile",
    )
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    top_p: float = Field(default=0.9, ge=0.0, le=1.0)
