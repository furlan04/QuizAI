import logging
import instructor
from groq import Groq
from ..state import AgentState
from ..prompts.generator_prompt import (
    GENERATOR_SYSTEM_PROMPT,
    GENERATOR_USER_PROMPT,
    GENERATOR_RESEARCH_SECTION,
    DOC_GENERATOR_SYSTEM_PROMPT,
    DOC_GENERATOR_USER_PROMPT,
)
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

        if state.source_text:
            # Document-grounded: retrieve the most relevant chunks per subtopic
            # via an ephemeral in-memory BM25 index, then ground generation on them.
            from ..rag import DocumentIndex  # lazy: only the document path needs rank-bm25

            index = DocumentIndex(
                state.source_text,
                settings.rag_chunk_size,
                settings.rag_chunk_overlap,
            )
            queries = [plan.get("topic", state.topic)] + [
                s["subtopic"] for s in plan.get("subtopics", [])
            ]
            context = index.build_context(
                queries,
                k_per_query=settings.rag_k,
                max_chars=settings.rag_context_chars,
            )
            system_msg = DOC_GENERATOR_SYSTEM_PROMPT
            user_msg = DOC_GENERATOR_USER_PROMPT.format(
                total_questions=state.num_questions,
                topic=plan.get("topic", state.topic),
                difficulty=plan.get("difficulty", state.difficulty),
                language=plan.get("language", "en"),
                subtopics=subtopics_text,
                notes=plan.get("notes") or "None",
                context=context or state.source_text[: settings.rag_context_chars],
            )
        else:
            system_msg = GENERATOR_SYSTEM_PROMPT
            user_msg = GENERATOR_USER_PROMPT.format(
                total_questions=state.num_questions,
                topic=plan.get("topic", state.topic),
                difficulty=plan.get("difficulty", state.difficulty),
                language=plan.get("language", "en"),
                subtopics=subtopics_text,
                notes=plan.get("notes") or "None",
            )
            # Deep search: ground generation on any web-gathered facts.
            if state.web_context:
                user_msg += GENERATOR_RESEARCH_SECTION.format(research=state.web_context)

        result: RawQuestions = client.chat.completions.create(
            model=settings.groq_model,
            response_model=RawQuestions,
            messages=[
                {"role": "system", "content": system_msg},
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
