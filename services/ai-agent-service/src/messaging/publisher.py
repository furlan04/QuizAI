import json
import logging
import aio_pika
from ..contracts.events import QuizGeneratedEvent
from ..contracts.schema_validator import validate_output
from ..config import settings

logger = logging.getLogger(__name__)


async def publish_quiz_generated(
    channel: aio_pika.abc.AbstractChannel,
    event: QuizGeneratedEvent,
) -> None:
    """
    Validates the event against the JSON Schema contract, then publishes it.
    Raises on contract violation or broker failure so the caller can nack.
    """
    body = json.loads(event.model_dump_json())
    validate_output(body)

    await channel.default_exchange.publish(
        aio_pika.Message(
            body=json.dumps(body).encode(),
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
