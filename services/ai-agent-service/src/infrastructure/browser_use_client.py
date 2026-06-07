"""
Thin synchronous client for the Browser Use Cloud API.

Used by the researcher node to consult the web before a quiz is planned, so the
generated questions can be grounded in additional, up-to-date information about
the topic. It is entirely opt-in: deep search only runs when a request sets the
``deep_search`` flag and a ``BROWSER_USE_API_KEY`` is configured.

The flow mirrors the Browser Use Cloud REST API:
    1. POST /api/v1/run-task          → starts a browser agent, returns a task id
    2. GET  /api/v1/task/{id}         → polled until the task reaches a terminal
                                        state; the agent's answer is in ``output``

Failures are deliberately non-fatal: callers treat an empty string as "no web
context" and fall back to plain, prompt-only generation.
"""
import logging
import time

import httpx

from ..config import settings

logger = logging.getLogger(__name__)

# Terminal task states reported by the Browser Use API.
_DONE_STATES = {"finished", "completed", "stopped"}
_FAILED_STATES = {"failed", "error"}

_RESEARCH_TASK = (
    "Search the web for accurate, up-to-date, factual information about the "
    "topic: \"{topic}\". Gather the key facts, definitions, important dates, "
    "notable people, and commonly examined details that would be useful for "
    "writing a {difficulty} difficulty quiz. Prefer reputable sources. "
    "Return the findings as concise, self-contained factual notes (bullet "
    "points are fine). Do not write quiz questions — only the reference facts."
)


def is_enabled() -> bool:
    """True when an API key is configured, so deep search can run."""
    return bool(settings.browser_use_api_key)


def research_topic(topic: str, difficulty: str) -> str:
    """
    Run a Browser Use web-research task for ``topic`` and return the agent's
    factual notes as plain text. Returns "" on any failure or timeout so the
    caller can degrade gracefully to prompt-only generation.
    """
    if not is_enabled():
        logger.info("Deep search requested but BROWSER_USE_API_KEY is not set; skipping")
        return ""

    base = settings.browser_use_base_url.rstrip("/")
    headers = {
        "Authorization": f"Bearer {settings.browser_use_api_key}",
        "Content-Type": "application/json",
    }
    task = _RESEARCH_TASK.format(topic=topic, difficulty=difficulty)

    try:
        with httpx.Client(timeout=30.0, headers=headers) as client:
            run = client.post(f"{base}/api/v1/run-task", json={"task": task})
            run.raise_for_status()
            task_id = run.json().get("id")
            if not task_id:
                logger.warning("Browser Use run-task returned no task id")
                return ""

            output = _poll_for_output(client, base, task_id)
    except httpx.HTTPError as exc:
        logger.warning("Deep search failed for topic='%s': %s", topic, exc)
        return ""

    if not output:
        return ""

    output = output.strip()
    logger.info(
        "Deep search completed for topic='%s' (%d chars of web context)",
        topic,
        len(output),
    )
    return output[: settings.deep_search_context_chars]


def _poll_for_output(client: httpx.Client, base: str, task_id: str) -> str:
    """Poll a task until it reaches a terminal state or the budget expires."""
    deadline = time.monotonic() + settings.browser_use_timeout
    while time.monotonic() < deadline:
        resp = client.get(f"{base}/api/v1/task/{task_id}")
        resp.raise_for_status()
        data = resp.json()
        status = (data.get("status") or "").lower()

        if status in _DONE_STATES:
            return data.get("output") or ""
        if status in _FAILED_STATES:
            logger.warning("Browser Use task %s ended with status=%s", task_id, status)
            return ""

        time.sleep(settings.browser_use_poll_interval)

    logger.warning("Browser Use task %s timed out after %.0fs", task_id, settings.browser_use_timeout)
    return ""
