"""
Loads JSON Schema contracts from shared/contracts/events/ and exposes
validate_input / validate_output helpers used at the messaging boundary.
"""
import json
import logging
from functools import lru_cache
from pathlib import Path

from jsonschema import ValidationError, validate

logger = logging.getLogger(__name__)

def _resolve_schemas_dir() -> Path:
    """
    Locates shared/contracts/events/ across layouts:
      - Docker:  /app/shared/contracts/events  (shared copied next to src/)
      - Local:   <repo>/shared/contracts/events (4 levels up from this file)
    Walks up from this file looking for a 'shared/contracts/events' directory.
    """
    suffix = Path("shared") / "contracts" / "events"
    here = Path(__file__).resolve()
    for parent in here.parents:
        candidate = parent / suffix
        if candidate.is_dir():
            return candidate
    # Last-resort fallback (Docker layout): /app/shared/contracts/events
    return Path("/app") / suffix


_SCHEMAS_DIR = _resolve_schemas_dir()


@lru_cache(maxsize=None)
def _load_schema(filename: str) -> dict:
    path = _SCHEMAS_DIR / filename
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def validate_input(body: dict) -> None:
    """
    Validates an incoming quiz.generate message body against its JSON Schema.
    Raises ContractViolationError on failure.
    """
    _validate(body, "quiz.generate.json", direction="input")


def validate_output(body: dict) -> None:
    """
    Validates an outgoing quiz.generated message body against its JSON Schema.
    Raises ContractViolationError on failure.
    """
    _validate(body, "quiz.generated.json", direction="output")


def _validate(body: dict, schema_file: str, direction: str) -> None:
    try:
        schema = _load_schema(schema_file)
        validate(instance=body, schema=schema)
    except ValidationError as exc:
        raise ContractViolationError(
            f"Contract violation ({direction}, {schema_file}): {exc.message} "
            f"at {' -> '.join(str(p) for p in exc.absolute_path)}"
        ) from exc


class ContractViolationError(ValueError):
    """Raised when a message does not conform to its JSON Schema contract."""
