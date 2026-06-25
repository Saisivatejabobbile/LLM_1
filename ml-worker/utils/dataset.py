"""
Dataset loading, parsing, and formatting utilities.
Handles TXT, PDF, JSONL, JSON, and CSV source files.
"""

import csv
import json
import logging
import re
import textwrap
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ── Chunking helpers ──────────────────────────────────────────────────────────

CHUNK_SIZE = 500          # chars per text chunk
CHUNK_OVERLAP = 50        # overlap between chunks
MIN_CHUNK_LENGTH = 80     # discard chunks shorter than this


def _split_into_chunks(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """Split plain text into overlapping character chunks, respecting paragraph breaks."""
    # First try to split on double newlines (paragraphs)
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks: List[str] = []

    buffer = ""
    for para in paragraphs:
        if len(buffer) + len(para) + 1 <= chunk_size:
            buffer = (buffer + " " + para).strip()
        else:
            if buffer and len(buffer) >= MIN_CHUNK_LENGTH:
                chunks.append(buffer)
            # Para itself may be longer than chunk_size; wrap it
            if len(para) > chunk_size:
                for i in range(0, len(para), chunk_size - overlap):
                    sub = para[i: i + chunk_size]
                    if len(sub) >= MIN_CHUNK_LENGTH:
                        chunks.append(sub)
                buffer = ""
            else:
                buffer = para

    if buffer and len(buffer) >= MIN_CHUNK_LENGTH:
        chunks.append(buffer)

    return chunks


# ── Instruction / output pair generation ──────────────────────────────────────

_INSTRUCTION_TEMPLATES = [
    "Explain the following text in detail:",
    "Summarize the key points from the following passage:",
    "What is the main idea conveyed in the following text?",
    "Describe what is discussed in the following excerpt:",
    "Provide a detailed explanation of the following content:",
    "Based on the following text, explain the core concepts:",
    "Extract and explain the important information from the following:",
    "Analyze and describe the following passage:",
]


def _make_instruction(chunk_index: int) -> str:
    return _INSTRUCTION_TEMPLATES[chunk_index % len(_INSTRUCTION_TEMPLATES)]


def _text_chunk_to_row(idx: int, chunk: str) -> Dict[str, Any]:
    return {
        "id": idx,
        "instruction": _make_instruction(idx),
        "input": "",
        "output": chunk.strip(),
    }


# ── Detect if text is already instruction/output formatted ───────────────────

def _try_parse_instruction_output(text: str) -> Optional[Dict[str, str]]:
    """
    Detect common patterns like:
      ### Instruction: ...
      ### Input: ...
      ### Response: ...
    or
      Instruction: ...
      Output: ...
    """
    patterns = [
        # Alpaca-style
        (
            r"(?:###\s*)?[Ii]nstruction[:\s]+(.+?)(?:###\s*)?(?:[Ii]nput[:\s]+(.+?))?(?:###\s*)?(?:[Rr]esponse|[Oo]utput)[:\s]+(.+)",
            True,
        ),
        # Simple Q/A style
        (
            r"(?:[Qq](?:uestion)?[:\s]+(.+?))[Aa](?:nswer)?[:\s]+(.+)",
            False,
        ),
    ]
    for pattern, has_input in patterns:
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        if match:
            groups = match.groups()
            if has_input and len(groups) >= 3:
                return {
                    "instruction": (groups[0] or "").strip(),
                    "input": (groups[1] or "").strip(),
                    "output": (groups[2] or "").strip(),
                }
            elif not has_input and len(groups) >= 2:
                return {
                    "instruction": (groups[0] or "").strip(),
                    "input": "",
                    "output": (groups[1] or "").strip(),
                }
    return None


# ── File readers ──────────────────────────────────────────────────────────────

def _read_txt(file_path: Path) -> List[Dict[str, Any]]:
    text = file_path.read_text(encoding="utf-8", errors="replace")
    # Try to detect if already in instruction/output format
    parsed = _try_parse_instruction_output(text)
    if parsed:
        return [{"id": 0, **parsed}]
    chunks = _split_into_chunks(text)
    return [_text_chunk_to_row(i, chunk) for i, chunk in enumerate(chunks)]


def _read_pdf(file_path: Path) -> List[Dict[str, Any]]:
    try:
        import pdfplumber  # type: ignore
    except ImportError:
        raise ImportError("pdfplumber is required for PDF parsing. Install it with: pip install pdfplumber")

    pages_text: List[str] = []
    with pdfplumber.open(str(file_path)) as pdf:
        for page in pdf.pages:
            txt = page.extract_text()
            if txt:
                pages_text.append(txt)

    full_text = "\n\n".join(pages_text)
    if not full_text.strip():
        raise ValueError(f"Could not extract any text from PDF: {file_path}")

    chunks = _split_into_chunks(full_text)
    return [_text_chunk_to_row(i, chunk) for i, chunk in enumerate(chunks)]


def _read_jsonl(file_path: Path) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    with file_path.open("r", encoding="utf-8", errors="replace") as fh:
        for line_num, line in enumerate(fh):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError as exc:
                logger.warning(f"Skipping invalid JSON on line {line_num + 1}: {exc}")
                continue
            rows.append(_normalize_row(line_num, obj))
    return rows


def _read_json(file_path: Path) -> List[Dict[str, Any]]:
    with file_path.open("r", encoding="utf-8", errors="replace") as fh:
        data = json.load(fh)
    if isinstance(data, list):
        return [_normalize_row(i, item) for i, item in enumerate(data)]
    elif isinstance(data, dict):
        return [_normalize_row(0, data)]
    else:
        raise ValueError(f"Unsupported JSON structure in {file_path}")


def _read_csv(file_path: Path) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    with file_path.open("r", encoding="utf-8", errors="replace", newline="") as fh:
        reader = csv.DictReader(fh)
        for i, row in enumerate(reader):
            rows.append(_normalize_row(i, dict(row)))
    return rows


def _normalize_row(idx: int, obj: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalise a raw dict into {id, instruction, input, output}.
    Handles common field name variants.
    """
    instruction = (
        obj.get("instruction")
        or obj.get("prompt")
        or obj.get("question")
        or obj.get("system")
        or "Explain the following:"
    )
    input_field = obj.get("input") or obj.get("context") or ""
    output = (
        obj.get("output")
        or obj.get("response")
        or obj.get("answer")
        or obj.get("completion")
        or obj.get("text")
        or ""
    )
    if not output and not input_field:
        # Treat the whole object's text-like fields as output
        text_val = " ".join(str(v) for v in obj.values() if isinstance(v, str))
        output = text_val

    return {
        "id": idx,
        "instruction": str(instruction).strip(),
        "input": str(input_field).strip(),
        "output": str(output).strip(),
    }


# ── Public API ────────────────────────────────────────────────────────────────

def parse_file_to_rows(file_path: Path, file_type: str) -> List[Dict[str, Any]]:
    """
    Parse a dataset file and return a list of instruction/input/output dicts.
    """
    ft = file_type.lower()
    readers = {
        "txt": _read_txt,
        "pdf": _read_pdf,
        "jsonl": _read_jsonl,
        "json": _read_json,
        "csv": _read_csv,
    }
    if ft not in readers:
        raise ValueError(f"Unsupported file_type '{ft}'. Supported: {list(readers.keys())}")

    rows = readers[ft](file_path)
    # Filter out rows with empty output
    rows = [r for r in rows if r.get("output", "").strip()]
    # Re-index
    for i, row in enumerate(rows):
        row["id"] = i
    return rows


def load_jsonl_dataset(dataset_path: str) -> List[Dict[str, Any]]:
    """
    Load a JSONL dataset from an absolute or relative path.
    Returns list of {instruction, input, output} dicts.
    """
    path = Path(dataset_path)
    if not path.exists():
        raise FileNotFoundError(f"Dataset file not found: {dataset_path}")

    suffix = path.suffix.lower()
    if suffix == ".jsonl":
        return _read_jsonl(path)
    elif suffix == ".json":
        return _read_json(path)
    elif suffix == ".csv":
        return _read_csv(path)
    else:
        # Fallback: try JSONL first, then JSON
        try:
            return _read_jsonl(path)
        except Exception:
            return _read_json(path)
