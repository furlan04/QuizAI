import logging
from datetime import datetime, timezone
from ..state import AgentState

logger = logging.getLogger(__name__)

_TOPIC_TAG_MAP: dict[str, list[str]] = {
    "python": ["programming", "python", "software"],
    "javascript": ["programming", "javascript", "web"],
    "history": ["history", "humanities"],
    "science": ["science", "stem"],
    "math": ["mathematics", "stem"],
    "geography": ["geography", "social-studies"],
    "biology": ["biology", "science", "stem"],
    "chemistry": ["chemistry", "science", "stem"],
    "physics": ["physics", "science", "stem"],
    "literature": ["literature", "humanities"],
    "music": ["music", "arts"],
    "art": ["visual-art", "arts"],
    "sports": ["sports", "leisure"],
    "technology": ["technology", "stem"],
    "economics": ["economics", "social-studies"],
}


def _derive_tags(topic: str, plan: dict | None) -> list[str]:
    tags: set[str] = set()

    lower_topic = topic.lower()
    for keyword, keyword_tags in _TOPIC_TAG_MAP.items():
        if keyword in lower_topic:
            tags.update(keyword_tags)

    if plan:
        difficulty = plan.get("difficulty", "")
        if difficulty:
            tags.add(difficulty)
        language = plan.get("language", "en")
        tags.add(f"lang:{language}")

    normalised = lower_topic.replace(" ", "-").strip("-")
    if normalised:
        tags.add(normalised)

    return sorted(tags)


def enricher_node(state: AgentState) -> dict:
    try:
        tags = _derive_tags(state.topic, state.plan)
        if state.source_text:
            tags = sorted(set(tags) | {"source:document"})

        generated_at = datetime.now(tz=timezone.utc).isoformat()
        language = (state.plan or {}).get("language", "en")

        questions = list(state.validated_questions or [])
        for q in questions:
            q["metadata"] = {
                "language": language,
                "generated_at": generated_at,
                "difficulty": state.difficulty,
            }

        logger.info("Enricher completed for quiz_id=%s, tags=%s", state.quiz_id, tags)
        return {"tags": tags, "validated_questions": questions}

    except Exception as exc:
        logger.exception("Enricher node failed for quiz_id=%s", state.quiz_id)
        return {"error": f"Enricher failed: {exc}"}
