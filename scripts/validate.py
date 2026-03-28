#!/usr/bin/env python3
"""
Validation script for AGI Progress Tracker data files.
Validates JSON schema, required fields, and data integrity.
"""

import json
import os
import re
import sys
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent

# Configuration
REQUIRED_FIELDS = [
    "date",
    "title",
    "organization",
    "level",
    "tags",
    "description",
    "sources",
]
VALID_ORGANIZATIONS = [
    "OpenAI",
    "Google",
    "Google DeepMind",
    "Anthropic",
    "Meta AI",
    "Microsoft",
    "Mistral AI",
    "Cohere",
    "AI21 Labs",
    "Stability AI",
    "NVIDIA",
    "EleutherAI",
    "Allen Institute for AI",
    "Berkeley",
    "Stanford",
    "DeepSeek",
    "xAI",
    "Midjourney",
    "Character.AI",
    "Apple",
    "Amazon",
    "Samsung",
    "Baidu",
    "Alibaba",
    "Tencent",
    "Yandex",
    "Naver",
    "University of Toronto",
    "University of Montreal",
    "University of Oxford",
    "GitHub",
    "Cognition Labs",
    "University of Manchester",
    "Salesforce",
    "Carnegie Mellon",
    "Databricks",
    "Moonshot AI",
    "IBM",
    "Adobe",
    "Black Forest Labs",
    "Midjourney",
]
VALID_LEVELS = ["landmark", "major", "notable", "minor"]
VALID_TAGS = {
    # Organizations
    "anthropic",
    "github",
    "google",
    "google-deepmind",
    "meta-ai",
    "microsoft",
    "openai",
    "stability-ai",
    "xai",
    # Models and families
    "bert",
    "chatgpt",
    "claude",
    "codex",
    "copilot",
    "ctrl",
    "dbrx",
    "deepseek",
    "gemini",
    "gpt",
    "grok",
    "kimi",
    "llama",
    "mamba",
    "mistral",
    "o1",
    "o3",
    "palm",
    "phi",
    "t5",
    # Categories
    "acquisition",
    "api-release",
    "benchmark",
    "benchmark-result",
    "funding",
    "infrastructure",
    "model-release",
    "model-update",
    "open-source",
    "partnership",
    "policy",
    "pricing",
    "product-launch",
    "regulation",
    "research-paper",
    "valuation",
    # Capabilities
    "agent",
    "coding",
    "image-generation",
    "llm",
    "long-context",
    "math",
    "memory",
    "multimodal",
    "reasoning",
    "speech",
    "video-generation",
    "vision",
    # Research and topics
    "adam",
    "ai",
    "alignment",
    "alphafold",
    "architecture",
    "attention",
    "capsule-networks",
    "cnn",
    "computer-use",
    "controllable-generation",
    "deep-learning",
    "deepmind",
    "devin",
    "diffusion",
    "efficiency",
    "few-shot",
    "framework",
    "game-playing",
    "gan",
    "generalist-agent",
    "generative-ai",
    "hinton",
    "instructgpt",
    "interpretability",
    "low-rank",
    "machine-learning",
    "milestone",
    "mixture-of-experts",
    "monetization",
    "neural-networks",
    "nlp",
    "normalization",
    "notebooklm",
    "optimization",
    "pre-training",
    "productivity",
    "protocol",
    "reinforcement-learning",
    "regularization",
    "rlhf",
    "safety",
    "scaling",
    "scaling-laws",
    "science",
    "search",
    "sequence-to-sequence",
    "sliding-window",
    "small-models",
    "standards",
    "stable-diffusion",
    "state-space-models",
    "swin",
    "training",
    "transformer",
    "translation",
    "word-embeddings",
    "mixtral",
    "gemma",
    "olmo",
    "qwen",
    "command-r",
    "granite",
    "arc-agi",
    "alibaba",
    "allen-institute-for-ai",
    "cohere",
    "midjourney",
    "firefly",
    "runway",
    "pika",
    "black-forest-labs",
    "adobe",
    "flux",
    "sora",
    "opus",
    "sonnet",
    # Product and ecosystem tags
    "bard",
    "claude-code",
    "cognition",
    "dalle",
}
MIN_SOURCES = 1
DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def resolve_repo_path(path: str | Path) -> Path:
    """Resolve relative project paths from the repository root."""
    raw_path = Path(path)
    return raw_path if raw_path.is_absolute() else REPO_ROOT / raw_path


class ValidationError:
    def __init__(self, file: str, message: str):
        self.file = file
        self.message = message

    def __str__(self) -> str:
        return f"[{self.file}] {self.message}"


def validate_date(date_str: str) -> tuple[bool, str]:
    """Validate date format (YYYY-MM-DD)."""
    if not DATE_PATTERN.match(date_str):
        return False, f"Invalid date format: {date_str}. Expected YYYY-MM-DD"

    try:
        year, month, day = int(date_str[:4]), int(date_str[5:7]), int(date_str[8:])
        if not (1 <= month <= 12 and 1 <= day <= 31):
            return False, f"Invalid date values: {date_str}"
        if year < 2010 or year > 2100:
            return False, f"Year out of reasonable range: {year}"
    except ValueError:
        return False, f"Invalid date: {date_str}"

    return True, ""


def validate_milestone(file_path: str, data: dict[str, Any]) -> list[ValidationError]:
    """Validate a single milestone JSON object."""
    errors: list[ValidationError] = []
    file_name = os.path.basename(file_path)

    for field in REQUIRED_FIELDS:
        if field not in data:
            errors.append(ValidationError(file_name, f"Missing required field: {field}"))

    if errors:
        return errors

    is_valid, error_msg = validate_date(data["date"])
    if not is_valid:
        errors.append(ValidationError(file_name, error_msg))

    if data["organization"] not in VALID_ORGANIZATIONS:
        errors.append(
            ValidationError(
                file_name,
                f"Unknown organization: {data['organization']}. "
                "Add to VALID_ORGANIZATIONS if this is a new organization.",
            )
        )

    if data["level"] not in VALID_LEVELS:
        errors.append(
            ValidationError(
                file_name,
                f"Invalid level: {data['level']}. Must be one of: {VALID_LEVELS}",
            )
        )

    if not isinstance(data["tags"], list):
        errors.append(ValidationError(file_name, "Tags must be an array"))
    else:
        for tag in data["tags"]:
            if tag not in VALID_TAGS:
                print(f"  Warning: [{file_name}] New tag: '{tag}'")

    if not isinstance(data["sources"], list):
        errors.append(ValidationError(file_name, "Sources must be an array"))
    elif len(data["sources"]) < MIN_SOURCES:
        errors.append(
            ValidationError(
                file_name,
                f"Must have at least {MIN_SOURCES} source(s), found {len(data['sources'])}",
            )
        )
    else:
        for index, source in enumerate(data["sources"]):
            if not isinstance(source, dict):
                errors.append(ValidationError(file_name, f"Source {index} must be an object"))
                continue
            if "title" not in source or "url" not in source:
                errors.append(
                    ValidationError(file_name, f"Source {index} missing 'title' or 'url'")
                )

    if not isinstance(data["description"], str) or len(data["description"].strip()) < 10:
        errors.append(ValidationError(file_name, "Description must be at least 10 characters"))

    if "highlights" in data and not isinstance(data["highlights"], list):
        errors.append(ValidationError(file_name, "Highlights must be an array"))

    return errors


def validate_data_directory(data_dir: str | Path = "data") -> tuple[list[ValidationError], int]:
    """
    Validate all JSON files in the data directory.
    Returns: (errors, total_files)
    """
    errors: list[ValidationError] = []
    total_files = 0
    data_path = resolve_repo_path(data_dir)

    if not data_path.exists():
        return [ValidationError("N/A", f"Data directory not found: {data_path}")], 0

    for year_dir in sorted(data_path.iterdir()):
        if not year_dir.is_dir():
            continue

        year = year_dir.name
        if not year.isdigit():
            continue

        for json_file in sorted(year_dir.glob("*.json")):
            total_files += 1
            try:
                with json_file.open("r", encoding="utf-8") as handle:
                    data = json.load(handle)

                file_errors = validate_milestone(str(json_file), data)
                errors.extend(file_errors)
            except json.JSONDecodeError as exc:
                errors.append(ValidationError(str(json_file), f"Invalid JSON: {exc}"))
            except Exception as exc:
                errors.append(ValidationError(str(json_file), f"Error reading file: {exc}"))

    return errors, total_files


def main() -> None:
    """Main validation entry point."""
    print("Validating AGI Progress Tracker data...\n")

    errors, total_files = validate_data_directory()
    print(f"Processed {total_files} milestone files\n")

    if errors:
        print(f"Found {len(errors)} error(s):\n")
        for error in errors:
            print(f"  {error}")
        print(f"\nValidation failed with {len(errors)} error(s)")
        sys.exit(1)

    print("All validations passed!")
    sys.exit(0)


if __name__ == "__main__":
    main()
