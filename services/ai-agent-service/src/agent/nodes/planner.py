import logging
import instructor
from groq import Groq
from ..state import AgentState
from ..prompts.planner_prompt import (
    PLANNER_SYSTEM_PROMPT,
    PLANNER_USER_PROMPT,
    PLANNER_RESEARCH_SECTION,
    DOC_PLANNER_SYSTEM_PROMPT,
    DOC_PLANNER_USER_PROMPT,
)
from ...contracts.models import QuizPlan
from ...config import settings

logger = logging.getLogger(__name__)


def planner_node(state: AgentState) -> dict:
    try:
        client = instructor.from_groq(Groq(api_key=settings.groq_api_key))

        if state.source_text:
            # Document-grounded: derive subtopics from the uploaded content.
            system_msg = DOC_PLANNER_SYSTEM_PROMPT.format(num_questions=state.num_questions)
            user_msg = DOC_PLANNER_USER_PROMPT.format(
                difficulty=state.difficulty,
                num_questions=state.num_questions,
                document=state.source_text[: settings.doc_overview_chars],
            )
        else:
            system_msg = PLANNER_SYSTEM_PROMPT.format(num_questions=state.num_questions)
            user_msg = PLANNER_USER_PROMPT.format(
                topic=state.topic,
                difficulty=state.difficulty,
                num_questions=state.num_questions,
            )
            # Deep search: fold any web-gathered facts into the planning prompt.
            if state.web_context:
                user_msg += PLANNER_RESEARCH_SECTION.format(research=state.web_context)

        plan: QuizPlan = client.chat.completions.create(
            model=settings.groq_model,
            response_model=QuizPlan,
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_msg},
            ],
            max_retries=2,
        )

        logger.info(
            "Planner completed for quiz_id=%s, subtopics=%d",
            state.quiz_id,
            len(plan.subtopics),
        )
        return {"plan": plan.model_dump()}

    except Exception as exc:
        logger.exception("Planner node failed for quiz_id=%s", state.quiz_id)
        return {"error": f"Planner failed: {exc}"}
