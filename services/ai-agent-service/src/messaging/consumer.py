"""
RabbitMQ consumer — listens on quiz.generate, acks ONLY after successful publish.
"""
import asyncio
import json
import logging

import aio_pika
from aio_pika.abc import AbstractIncomingMessage

from ..config import settings
from ..contracts.events import QuizGenerateEvent
from .handlers.quiz_generation_handler import handle_quiz_generate

logger = logging.getLogger(__name__)


async def _process_message(
    message: AbstractIncomingMessage,
    channel: aio_pika.abc.AbstractChannel,
) -> None:
    """
    Deserialises the message, delegates to the handler, then acks.
    Any exception propagates → the consumer nacks and RabbitMQ requeues.
    """
    async with message.process(requeue=True):
        body = json.loads(message.body)
        event = QuizGenerateEvent(**body)
        await handle_quiz_generate(event, channel)


async def start_consumer() -> None:
    """
    Connects to RabbitMQ and begins consuming quiz.generate.
    Retries connection up to 10 times with exponential backoff.
    """
    max_attempts = 10
    for attempt in range(1, max_attempts + 1):
        try:
            connection: aio_pika.RobustConnection = await aio_pika.connect_robust(
                settings.rabbitmq_url
            )
            async with connection:
                channel = await connection.channel()
                await channel.set_qos(prefetch_count=1)

                queue = await channel.declare_queue(
                    settings.rabbitmq_queue_consume,
                    durable=True,
                )
                # Also ensure publish queue exists
                await channel.declare_queue(
                    settings.rabbitmq_queue_publish,
                    durable=True,
                )

                logger.info(
                    "Consumer started — listening on '%s'",
                    settings.rabbitmq_queue_consume,
                )

                async for message in queue:
                    asyncio.create_task(
                        _process_message(message, channel)
                    )

        except Exception as exc:
            wait = min(2 ** attempt, 30)
            logger.warning(
                "RabbitMQ connection failed (attempt %d/%d): %s — retrying in %ds",
                attempt,
                max_attempts,
                exc,
                wait,
            )
            await asyncio.sleep(wait)

    logger.error("Consumer gave up after %d attempts.", max_attempts)
