"""
Entry point: starts FastAPI + RabbitMQ consumer concurrently via asyncio.gather.
"""
import asyncio
import logging

from contextlib import asynccontextmanager
from fastapi import FastAPI

from .api.routes.health import router as health_router
from .messaging.consumer import start_consumer
from .infrastructure.mongo_client import close_mongo_client

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Start the RabbitMQ consumer as a background task alongside FastAPI."""
    consumer_task = asyncio.create_task(start_consumer())
    logger.info("AI Agent service started")
    try:
        yield
    finally:
        consumer_task.cancel()
        try:
            await consumer_task
        except asyncio.CancelledError:
            pass
        await close_mongo_client()
        logger.info("AI Agent service stopped")


app = FastAPI(
    title="QuizAI — AI Agent Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(health_router)
