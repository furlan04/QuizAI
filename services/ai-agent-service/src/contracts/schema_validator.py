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

# shared/contracts/events/ is 4 levels up from this file
_SCHEMAS_DIR = Path(__file__).parents[4] / "shared" / "contracts" / "events"


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
