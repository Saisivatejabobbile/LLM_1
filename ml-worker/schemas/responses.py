"""
Pydantic v2 response models for all SLM Forge ML Worker endpoints.
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ── /health ───────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "ok"
    hardware: Dict[str, Any] = Field(default_factory=dict)


# ── /hardware ─────────────────────────────────────────────────────────────────

class HardwareResponse(BaseModel):
    device: str  # "cuda" | "mps" | "cpu"
    cuda_available: bool
    mps_available: bool
    gpu_name: Optional[str] = None
    vram_total_gb: Optional[float] = None
    vram_free_gb: Optional[float] = None
    vram_used_gb: Optional[float] = None
    ram_total_gb: float
    ram_free_gb: float
    ram_used_gb: float
    cpu_count: int
    warnings: List[str] = Field(default_factory=list)


# ── /format-dataset ───────────────────────────────────────────────────────────

class DatasetRow(BaseModel):
    id: int
    instruction: str
    input: str = ""
    output: str


class FormatDatasetResponse(BaseModel):
    rows: List[DatasetRow]
    count: int
    source_file: str
    file_type: str


# ── /train ────────────────────────────────────────────────────────────────────

class TrainStartResponse(BaseModel):
    job_id: str
    status: str = "started"
    message: str = "Training started in background"


class TrainProgressPayload(BaseModel):
    """Shape of the JSON POSTed to callback_url during training."""
    job_id: str
    progress: float  # 0–100
    loss: Optional[float] = None
    eval_loss: Optional[float] = None
    epoch: Optional[float] = None
    step: int
    total_steps: int
    status: str  # "running" | "completed" | "failed"
    error: Optional[str] = None
    adapter_path: Optional[str] = None


# ── /export ───────────────────────────────────────────────────────────────────

class ExportResponse(BaseModel):
    job_id: str
    status: str
    merged_path: str
    gguf_path: Optional[str] = None
    gguf_available: bool = False
    message: str = ""
    conversion_log: Optional[str] = None


# ── /evaluate ─────────────────────────────────────────────────────────────────

class EvaluationComparison(BaseModel):
    instruction: str
    input: str = ""
    reference: str
    base_output: str
    finetuned_output: str
    bleu: float
    rouge_l: float


class EvaluateResponse(BaseModel):
    job_id: str
    bleu_score: float
    rouge_1: float
    rouge_2: float
    rouge_l: float
    num_samples: int
    comparisons: List[EvaluationComparison]


# ── /deploy ───────────────────────────────────────────────────────────────────

class DeployResponse(BaseModel):
    job_id: str
    status: str
    ollama_model: Optional[str] = None
    ollama_available: bool = False
    hf_url: Optional[str] = None
    hf_pushed: bool = False
    modelfile_path: Optional[str] = None
    message: str = ""
