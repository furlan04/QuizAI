import logging
from ..state import AgentState

logger = logging.getLogger(__name__)

MAX_RETRIES = 3


def validator_node(state: AgentState) -> dict:
    """
    Validates raw_questions:
      - exactly 4 options per question
      - correct_index in [0, 3]
      - non-empty text
      - no duplicate question texts
      - count matches num_questions

    Returns a dict so that None values (e.g. error=None on success) are
    propagated explicitly — LangGraph drops None when nodes return a dataclass.
    """
    if state.error and state.raw_questions is None:
        return {}

    questions = state.raw_questions or []
    errors: list[str] = []

    if len(questions) != state.num_questions:
        errors.append(f"Expected {state.num_questions} questions, got {len(questions)}")

    seen_texts: set[str] = set()
    for idx, q in enumerate(questions):
        text = (q.get("text") or "").strip()
        options = q.get("options") or []
        correct_index = q.get("correct_index")

        if not text:
            errors.append(f"Question {idx}: empty text")

        if len(options) != 4:
            errors.append(f"Question {idx}: expected 4 options, got {len(options)}")

        if correct_index not in (0, 1, 2, 3):
            errors.append(
                f"Question {idx}: correct_index={correct_index} is out of range [0-3]"
            )

        if text in seen_texts:
            errors.append(f"Question {idx}: duplicate text '{text[:60]}…'")
        seen_texts.add(text)

    if errors:
        new_retry_count = state.retry_count + 1
        error_msg = "; ".join(errors)
        logger.warning(
            "Validation failed (attempt %d/%d) for quiz_id=%s: %s",
            new_retry_count,
            MAX_RETRIES,
            state.quiz_id,
            error_msg,
        )
        return {
            "retry_count": new_retry_count,
            "error": error_msg,
            "validated_questions": None,
        }

    logger.info(
        "Validation passed for quiz_id=%s (%d questions)",
        state.quiz_id,
        len(questions),
    )
    return {"validated_questions": questions, "error": None}


def should_retry(state: AgentState) -> str:
    """
    LangGraph routing function called after validator.
    Returns 'retry' → generator, 'done' → enricher, 'fail' → END.
    """
    if state.validated_questions is not None:
        return "done"
    if state.retry_count >= MAX_RETRIES:
        return "fail"
    return "retry"
