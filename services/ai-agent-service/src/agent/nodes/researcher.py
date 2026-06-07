"""
Deep-search node: consults the web (via Browser Use) before planning so the
quiz can be enriched with additional information on the topic.

Only reached when a request sets ``deep_search=True``. It is best-effort — if
the web call fails, times out, or no API key is configured, it returns an empty
web context and the pipeline proceeds exactly as it would without deep search.
"""
import logging

from ..state import AgentState
from ...infrastructure.browser_use_client import research_topic

logger = logging.getLogger(__name__)


def researcher_node(state: AgentState) -> dict:
    # Document-grounded quizzes are intentionally restricted to the uploaded
    # text; web research would contradict that contract, so skip it.
    if state.source_text:
        logger.info(
            "Skipping deep search for quiz_id=%s: document grounding takes precedence",
            state.quiz_id,
        )
        return {"web_context": ""}

    try:
        web_context = research_topic(state.topic, state.difficulty)
        return {"web_context": web_context}
    except Exception:
        # Never fail the pipeline because of optional web research.
        logger.exception("Researcher node failed for quiz_id=%s; continuing without web context", state.quiz_id)
        return {"web_context": ""}
