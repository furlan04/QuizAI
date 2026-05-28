import json
import logging
import aio_pika
from ..contracts.events import QuizGeneratedEvent
from ..config import settings

logger = logging.getLogger(__name__)


async def publish_quiz_generated(
    channel: aio_pika.abc.AbstractChannel,
    event: QuizGeneratedEvent,
) -> None:
    """
    Publishes a QuizGeneratedEvent to the quiz.generated queue.
    Raises on failure so the caller (handler) can decide whether to ack/nack.
    """
    payload = event.model_dump_json().encode()

    await channel.default_exchange.publish(
        aio_pika.Message(
            body=payload,
            content_type="application/json",
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
        ),
        routing_key=settings.rabbitmq_queue_publish,
    )

    logger.info(
        "Published quiz.generated for quiz_id=%s status=%s",
        event.quiz_id,
        event.status,
    )
