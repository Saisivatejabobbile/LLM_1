"""
POST /format-dataset — parse an uploaded file into instruction/input/output rows.
"""

import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException

from config.settings import settings
from schemas.requests import FormatDatasetRequest
from schemas.responses import DatasetRow, FormatDatasetResponse
from utils.dataset import parse_file_to_rows

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/format-dataset", response_model=FormatDatasetResponse)
async def format_dataset(request: FormatDatasetRequest) -> FormatDatasetResponse:
    """
    Parse an uploaded dataset file (TXT / PDF / JSONL / JSON / CSV) and return
    a list of structured instruction / input / output rows.

    - TXT / PDF: text is chunked (500 chars) and each chunk becomes an
      instruction/output pair using rotating instruction templates.
    - JSONL / JSON / CSV: rows are normalised — common field name variants
      (prompt, question, answer, completion …) are mapped to the standard schema.
    """
    # Resolve absolute file path
    file_path = Path(settings.upload_dir) / request.file_path

    # Also accept an absolute path (for backward compatibility)
    if not file_path.exists() and Path(request.file_path).exists():
        file_path = Path(request.file_path)

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"File not found: {request.file_path} (resolved to {file_path})",
        )

    try:
        raw_rows = parse_file_to_rows(file_path, request.file_type)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except ImportError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        logger.error(f"Dataset parsing error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to parse dataset: {exc}") from exc

    if not raw_rows:
        raise HTTPException(
            status_code=422,
            detail="No valid rows could be extracted from the file.",
        )

    rows = [DatasetRow(**row) for row in raw_rows]
    logger.info(
        f"Formatted dataset for project={request.project_id}: "
        f"{len(rows)} rows from {file_path.name} ({request.file_type})"
    )

    return FormatDatasetResponse(
        rows=rows,
        count=len(rows),
        source_file=str(file_path),
        file_type=request.file_type,
    )
