"""
Chat template formatters for different model families.

Each formatter takes (instruction, input, output) and returns a single
formatted string that will be fed to the tokenizer / SFTTrainer.
"""

from typing import Callable, Dict, Optional


# ── Template functions ────────────────────────────────────────────────────────

def _alpaca_format(instruction: str, input_text: str, output: str) -> str:
    """Generic Alpaca / instruction-following format."""
    if input_text.strip():
        return (
            f"### Instruction:\n{instruction}\n\n"
            f"### Input:\n{input_text}\n\n"
            f"### Response:\n{output}"
        )
    return (
        f"### Instruction:\n{instruction}\n\n"
        f"### Response:\n{output}"
    )


def _phi3_format(instruction: str, input_text: str, output: str) -> str:
    """Phi-3 chat template: <|user|>...<|end|><|assistant|>...<|end|>"""
    user_content = instruction
    if input_text.strip():
        user_content = f"{instruction}\n\n{input_text}"
    return (
        f"<|user|>\n{user_content}<|end|>\n"
        f"<|assistant|>\n{output}<|end|>"
    )


def _gemma_format(instruction: str, input_text: str, output: str) -> str:
    """Gemma chat template: <start_of_turn>user...<end_of_turn><start_of_turn>model..."""
    user_content = instruction
    if input_text.strip():
        user_content = f"{instruction}\n\n{input_text}"
    return (
        f"<start_of_turn>user\n{user_content}<end_of_turn>\n"
        f"<start_of_turn>model\n{output}<end_of_turn>"
    )


def _llama3_format(instruction: str, input_text: str, output: str) -> str:
    """Llama 3 chat template with special tokens."""
    user_content = instruction
    if input_text.strip():
        user_content = f"{instruction}\n\n{input_text}"
    return (
        "<|begin_of_text|>"
        "<|start_header_id|>system<|end_header_id|>\n\n"
        "You are a helpful assistant.<|eot_id|>"
        "<|start_header_id|>user<|end_header_id|>\n\n"
        f"{user_content}<|eot_id|>"
        "<|start_header_id|>assistant<|end_header_id|>\n\n"
        f"{output}<|eot_id|>"
    )


def _mistral_format(instruction: str, input_text: str, output: str) -> str:
    """Mistral instruction format: [INST]...[/INST]..."""
    user_content = instruction
    if input_text.strip():
        user_content = f"{instruction}\n\n{input_text}"
    return f"[INST] {user_content} [/INST] {output}</s>"


def _chatml_format(instruction: str, input_text: str, output: str) -> str:
    """ChatML format: <|im_start|>...<|im_end|> (used by Qwen, etc.)"""
    user_content = instruction
    if input_text.strip():
        user_content = f"{instruction}\n\n{input_text}"
    return (
        "<|im_start|>system\nYou are a helpful assistant.<|im_end|>\n"
        f"<|im_start|>user\n{user_content}<|im_end|>\n"
        f"<|im_start|>assistant\n{output}<|im_end|>"
    )


# ── Registry ──────────────────────────────────────────────────────────────────

_TEMPLATE_REGISTRY: Dict[str, Callable[[str, str, str], str]] = {
    "phi3": _phi3_format,
    "gemma": _gemma_format,
    "llama3": _llama3_format,
    "mistral": _mistral_format,
    "chatml": _chatml_format,
    "alpaca": _alpaca_format,
}


def format_chat(
    instruction: str,
    input_text: str,
    output: str,
    template_name: str = "alpaca",
) -> str:
    """
    Format an instruction/input/output triple using the specified chat template.

    Args:
        instruction: The instruction / user prompt.
        input_text:  Optional additional input / context.
        output:      The expected model response.
        template_name: One of 'phi3', 'gemma', 'llama3', 'mistral', 'chatml', 'alpaca'.

    Returns:
        Formatted string ready for tokenisation.
    """
    formatter = _TEMPLATE_REGISTRY.get(template_name, _alpaca_format)
    return formatter(instruction, input_text, output)


def format_inference_prompt(
    instruction: str,
    input_text: str,
    template_name: str = "alpaca",
) -> str:
    """
    Format a prompt for inference (no output / response section).
    """
    if template_name == "phi3":
        user_content = instruction
        if input_text.strip():
            user_content = f"{instruction}\n\n{input_text}"
        return f"<|user|>\n{user_content}<|end|>\n<|assistant|>\n"

    elif template_name == "gemma":
        user_content = instruction
        if input_text.strip():
            user_content = f"{instruction}\n\n{input_text}"
        return f"<start_of_turn>user\n{user_content}<end_of_turn>\n<start_of_turn>model\n"

    elif template_name == "llama3":
        user_content = instruction
        if input_text.strip():
            user_content = f"{instruction}\n\n{input_text}"
        return (
            "<|begin_of_text|>"
            "<|start_header_id|>system<|end_header_id|>\n\n"
            "You are a helpful assistant.<|eot_id|>"
            "<|start_header_id|>user<|end_header_id|>\n\n"
            f"{user_content}<|eot_id|>"
            "<|start_header_id|>assistant<|end_header_id|>\n\n"
        )

    elif template_name == "mistral":
        user_content = instruction
        if input_text.strip():
            user_content = f"{instruction}\n\n{input_text}"
        return f"[INST] {user_content} [/INST]"

    elif template_name == "chatml":
        user_content = instruction
        if input_text.strip():
            user_content = f"{instruction}\n\n{input_text}"
        return (
            "<|im_start|>system\nYou are a helpful assistant.<|im_end|>\n"
            f"<|im_start|>user\n{user_content}<|im_end|>\n"
            "<|im_start|>assistant\n"
        )

    else:
        # Alpaca / default
        if input_text.strip():
            return (
                f"### Instruction:\n{instruction}\n\n"
                f"### Input:\n{input_text}\n\n"
                "### Response:\n"
            )
        return f"### Instruction:\n{instruction}\n\n### Response:\n"


def get_available_templates() -> list[str]:
    return list(_TEMPLATE_REGISTRY.keys())
