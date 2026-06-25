"""
Hugging Face TrainerCallback that posts training progress to a webhook URL.
"""

import logging
import threading
from typing import Any, Dict, Optional

import httpx
from transformers import TrainerCallback, TrainerControl, TrainerState, TrainingArguments

logger = logging.getLogger(__name__)


class ProgressWebhookCallback(TrainerCallback):
    """
    Posts training progress to a webhook URL every `report_every_steps` steps.

    The payload shape matches TrainProgressPayload in schemas/responses.py:
    {
        "job_id": str,
        "progress": float,      # 0–100
        "loss": float | null,
        "eval_loss": float | null,
        "epoch": float | null,
        "step": int,
        "total_steps": int,
        "status": "running" | "completed" | "failed",
        "error": str | null,
        "adapter_path": str | null,
    }
    """

    def __init__(
        self,
        callback_url: str,
        job_id: str,
        total_steps: int,
        report_every_steps: int = 10,
        timeout_seconds: int = 5,
    ) -> None:
        self.callback_url = callback_url
        self.job_id = job_id
        self.total_steps = max(total_steps, 1)
        self.report_every_steps = max(report_every_steps, 1)
        self.timeout_seconds = timeout_seconds
        self._client = httpx.Client(timeout=timeout_seconds)
        self._last_loss: Optional[float] = None
        self._last_eval_loss: Optional[float] = None

    def _post(self, payload: Dict[str, Any]) -> None:
        """Post payload to callback URL in a fire-and-forget fashion."""
        def _do_post():
            try:
                self._client.post(self.callback_url, json=payload)
            except Exception as exc:
                logger.debug(f"Webhook POST failed (non-fatal): {exc}")

        t = threading.Thread(target=_do_post, daemon=True)
        t.start()

    def on_log(
        self,
        args: TrainingArguments,
        state: TrainerState,
        control: TrainerControl,
        logs: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> None:
        if not logs:
            return

        # Track latest losses
        if "loss" in logs:
            self._last_loss = logs["loss"]
        if "eval_loss" in logs:
            self._last_eval_loss = logs["eval_loss"]

        # Report every N steps
        if state.global_step % self.report_every_steps != 0:
            return

        progress = min((state.global_step / self.total_steps) * 100.0, 100.0)

        self._post(
            {
                "job_id": self.job_id,
                "progress": round(progress, 2),
                "loss": self._last_loss,
                "eval_loss": self._last_eval_loss,
                "epoch": round(state.epoch, 4) if state.epoch is not None else None,
                "step": state.global_step,
                "total_steps": self.total_steps,
                "status": "running",
                "error": None,
                "adapter_path": None,
            }
        )

    def on_epoch_end(
        self,
        args: TrainingArguments,
        state: TrainerState,
        control: TrainerControl,
        **kwargs: Any,
    ) -> None:
        """Always report at the end of each epoch."""
        progress = min((state.global_step / self.total_steps) * 100.0, 100.0)
        self._post(
            {
                "job_id": self.job_id,
                "progress": round(progress, 2),
                "loss": self._last_loss,
                "eval_loss": self._last_eval_loss,
                "epoch": round(state.epoch, 4) if state.epoch is not None else None,
                "step": state.global_step,
                "total_steps": self.total_steps,
                "status": "running",
                "error": None,
                "adapter_path": None,
            }
        )

    def on_train_end(
        self,
        args: TrainingArguments,
        state: TrainerState,
        control: TrainerControl,
        **kwargs: Any,
    ) -> None:
        """Report training completion."""
        self._post(
            {
                "job_id": self.job_id,
                "progress": 100.0,
                "loss": self._last_loss,
                "eval_loss": self._last_eval_loss,
                "epoch": round(state.epoch, 4) if state.epoch is not None else None,
                "step": state.global_step,
                "total_steps": self.total_steps,
                "status": "running",  # Will be overridden by the train route on completion
                "error": None,
                "adapter_path": None,
            }
        )

    def __del__(self):
        try:
            self._client.close()
        except Exception:
            pass
