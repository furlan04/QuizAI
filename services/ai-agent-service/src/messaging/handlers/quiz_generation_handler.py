"""
Single coupling point between messaging and agent.
Receives a QuizGenerateEvent, runs the LangGraph pipeline,
builds the outgoing event, publishes it, and persists to Mongo.
"""
import logging
from datetime import datetime, timezone

import aio_pika

from ...agent import quiz_graph, AgentState
from ...contracts.events import QuizGenerateEvent, QuizGeneratedEvent
from ...contracts.models import Question
from ...infrastructure.mongo_client import save_generated_quiz
from ..publisher import publish_quiz_generated

logger = logging.getLogger(__name__)


async def handle_quiz_generate(
    incoming: QuizGenerateEvent,
    channel: aio_pika.abc.AbstractChannel,
) -> None:
    """
    Orchestrates: event → AgentState → graph.invoke → QuizGeneratedEvent → publish.
    Does NOT ack the RabbitMQ message — that's the consumer's responsibility after
    this coroutine returns successfully.
    """
    logger.info(
        "Handling quiz.generate for quiz_id=%s topic='%s'",
        incoming.quiz_id,
        incoming.topic,
    )

    initial_state = AgentState(
        quiz_id=incoming.quiz_id,
        topic=incoming.topic,
        difficulty=incoming.difficulty,
        num_questions=incoming.num_questions,
        user_id=incoming.user_id,
    )

    # Run the synchronous LangGraph pipeline in the event loop
    # (LangGraph compile() returns a sync-callable by default)
    final_state: AgentState = quiz_graph.invoke(initial_state)

    # Build outgoing event
    if final_state.validated_questions and not final_state.error:
        questions = [
            Question(**{k: v for k, v in q.items() if k != "metadata"})
            for q in final_state.validated_questions
        ]
        event = QuizGeneratedEvent(
            quiz_id=final_state.quiz_id,
            status="ready",
            questions=questions,
            tags=final_state.tags,
            error=None,
        )
    else:
        event = QuizGeneratedEvent(
            quiz_id=final_state.quiz_id,
            status="failed",
            questions=[],
            tags=[],
            error=final_state.error or "Unknown error during generation",
        )

    # Publish — raises if broker is unavailable (consumer will nack)
    await publish_quiz_generated(channel, event)

    # Persist to MongoDB (non-fatal)
    doc = {
        "quiz_id": event.quiz_id,
        "status": event.status,
        "questions": [q.model_dump() for q in event.questions],
        "tags": event.tags,
        "error": event.error,
        "user_id": incoming.user_id,
        "topic": incoming.topic,
        "difficulty": incoming.difficulty,
        "created_at": datetime.now(tz=timezone.utc).isoformat(),
    }
    await save_generated_quiz(doc)
