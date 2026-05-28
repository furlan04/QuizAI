"""
Thin wrapper around the Groq client with exponential-backoff retry.
Nodes import from here if they need a raw client; instructor wraps this internally.
"""
import logging
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)
from groq import Groq, APIStatusError, APIConnectionError
from ..config import settings

logger = logging.getLogger(__name__)


@retry(
    reraise=True,
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((APIConnectionError, APIStatusError)),
    before_sleep=lambda rs: logger.warning(
        "GROQ retry attempt %d after error", rs.attempt_number
    ),
)
def get_groq_client() -> Groq:
    """Returns a configured Groq client (stateless helper)."""
    return Groq(api_key=settings.groq_api_key)
