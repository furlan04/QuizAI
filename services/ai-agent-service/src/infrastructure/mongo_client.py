"""
Async MongoDB client using motor.
Saves generated quizzes for audit / replay.
"""
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from ..config import settings

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None


import bson
from datetime import datetime, timezone

def get_mongo_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongodb_url)
    return _client

async def create_quiz_skeleton(quiz_id: str, user_id: str, topic: str, difficulty: str, num_questions: int) -> None:
    """
    Creates a skeleton quiz in the 'quizzes' collection so that quiz-service
    can update it later when generation finishes.
    """
    try:
        client = get_mongo_client()
        db = client[settings.mongodb_db]
        collection = db["quizzes"]
        
        doc = {
            "_id": bson.ObjectId(quiz_id),
            "title": topic,
            "topic": topic,
            "difficulty": difficulty,
            "num_questions": num_questions,
            "questions": None,
            "tags": None,
            "created_by": user_id,
            "created_by_username": "Buddy",
            "status": "generating",
            "error": None,
            "created_at": datetime.now(timezone.utc)
        }
        await collection.insert_one(doc)
        logger.info("Created quiz skeleton for quiz_id=%s in MongoDB", quiz_id)
    except Exception as exc:
        logger.exception("Failed to create quiz skeleton for quiz_id=%s: %s", quiz_id, exc)


async def save_generated_quiz(quiz_document: dict) -> None:
    """
    Persists the final quiz document to MongoDB.
    Collection: quizai.generated_quizzes
    """
    try:
        client = get_mongo_client()
        db = client[settings.mongodb_db]
        collection = db["generated_quizzes"]
        await collection.insert_one(quiz_document)
        logger.info("Saved quiz_id=%s to MongoDB", quiz_document.get("quiz_id"))
    except Exception as exc:
        # Non-fatal: log and continue — RabbitMQ publishing must not be blocked
        logger.exception(
            "Failed to persist quiz_id=%s to MongoDB: %s",
            quiz_document.get("quiz_id"),
            exc,
        )


async def close_mongo_client() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
