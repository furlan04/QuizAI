import logging
import instructor
from groq import Groq
from ..state import AgentState
from ..prompts.generator_prompt import GENERATOR_SYSTEM_PROMPT, GENERATOR_USER_PROMPT
from ...contracts.models import RawQuestions
from ...config import settings

logger = logging.getLogger(__name__)


def generator_node(state: AgentState) -> dict:
    # Planner failed before any retry was attempted — skip generation
    if state.error and state.retry_count == 0:
        return {}

    try:
        plan = state.plan or {}
        subtopics_text = "\n".join(
            f"  - {s['subtopic']}: {s['num_questions']} question(s)"
            for s in plan.get("subtopics", [])
        )

        client = instructor.from_groq(Groq(api_key=settings.groq_api_key))

        user_msg = GENERATOR_USER_PROMPT.format(
            total_questions=state.num_questions,
            topic=plan.get("topic", state.topic),
            difficulty=plan.get("difficulty", state.difficulty),
            language=plan.get("language", "en"),
            subtopics=subtopics_text,
            notes=plan.get("notes") or "None",
        )

        result: RawQuestions = client.chat.completions.create(
            model=settings.groq_model,
            response_model=RawQuestions,
            messages=[
                {"role": "system", "content": GENERATOR_SYSTEM_PROMPT},
                {"role": "user", "content": user_msg},
            ],
            max_retries=2,
        )

        raw = [q.model_dump() for q in result.questions]
        logger.info(
            "Generator produced %d raw questions for quiz_id=%s",
            len(raw),
            state.quiz_id,
        )
        # error: None is an explicit clear — must be in the dict, not a dataclass field
        return {"raw_questions": raw, "error": None}

    except Exception as exc:
        logger.exception("Generator node failed for quiz_id=%s", state.quiz_id)
        return {"error": f"Generator failed: {exc}"}
