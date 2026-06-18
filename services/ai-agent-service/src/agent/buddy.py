import logging
import uuid
import json
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

from ..config import settings
from ..messaging.publisher import publish_quiz_generate_direct
from ..contracts.events import QuizGenerateEvent

logger = logging.getLogger(__name__)

_encoder = None
_qdrant = None
_llm = None

def get_encoder():
    global _encoder
    if _encoder is None:
        _encoder = SentenceTransformer('all-MiniLM-L6-v2')
    return _encoder

def get_qdrant():
    global _qdrant
    if _qdrant is None:
        _qdrant = QdrantClient(url=settings.qdrant_url)
    return _qdrant

def get_llm():
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            temperature=0.0, 
            groq_api_key=settings.groq_api_key, 
            model_name=settings.groq_model
        )
    return _llm

def retrieve_context(session_id: str, message: str) -> list[str]:
    try:
        encoder = get_encoder()
        qdrant = get_qdrant()
        
        query_vector = encoder.encode(message).tolist()
        
        results = qdrant.query_points(
            collection_name=session_id,
            query=query_vector,
            limit=5
        ).points
        
        chunks = []
        for res in results:
            if res.payload and "text" in res.payload:
                chunks.append(res.payload["text"])
            elif res.payload and "page_content" in res.payload:
                chunks.append(res.payload["page_content"])
            else:
                chunks.append(str(res.payload))
        return chunks
    except Exception as e:
        logger.warning(f"Failed to retrieve context from Qdrant for session {session_id}: {e}")
        return []

def is_quiz_request(message: str) -> bool:
    try:
        llm = get_llm()
        prompt = f"""You are a router. The user just said: "{message}"
Does the user want you to generate, create, or start a new quiz?
Reply ONLY 'YES' or 'NO'."""
        res = llm.invoke([SystemMessage(content=prompt)])
        return res.content.strip().upper().startswith("YES")
    except Exception as e:
        logger.error(f"Router LLM failed: {e}")
        text = message.lower()
        return "quiz" in text and ("generate" in text or "create" in text or "make" in text or "me" in text)

async def generate_chat_response(session_id: str, user_id: str, message: str, history: list[dict], username: str = "Buddy", chat_title: str = "Quiz") -> tuple[str, list[dict]]:
    chunks = retrieve_context(session_id, message)
    context_str = "\n\n".join(chunks)
    
    wants_quiz = is_quiz_request(message)
    if wants_quiz:
        import bson
        from ..infrastructure.mongo_client import create_quiz_skeleton
        
        quiz_id = str(bson.ObjectId())
        
        # Create skeleton in MongoDB so quiz-service can update it later
        await create_quiz_skeleton(
            quiz_id=quiz_id,
            user_id=user_id,
            topic=chat_title,
            difficulty="medium",
            num_questions=5,
            username=username
        )
        
        event = QuizGenerateEvent(
            quiz_id=quiz_id,
            topic=chat_title,
            difficulty="medium",
            num_questions=5,
            user_id=user_id,
            source_text=context_str if context_str else None,
            deep_search=False
        )
        await publish_quiz_generate_direct(event)
        
        response_text = "Quiz generation started, you'll find it in your quizzes shortly."
        
        updated_history = history + [
            {"role": "user", "content": message},
            {"role": "assistant", "content": response_text}
        ]
        return response_text, updated_history
        
    system_prompt = f"""You are 'Buddy', a helpful AI assistant for QuizAI.
Use the following retrieved context to answer the user's question, if relevant.
If you don't know the answer, say so.

Context:
{context_str}
"""
    
    messages = [SystemMessage(content=system_prompt)]
    for msg in history:
        role = msg.get("role")
        content = msg.get("content", "")
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role in ["assistant", "ai"]:
            messages.append(AIMessage(content=content))
            
    messages.append(HumanMessage(content=message))
    
    llm = get_llm()
    ai_msg = llm.invoke(messages)
    
    response_text = str(ai_msg.content)
    
    updated_history = history + [
        {"role": "user", "content": message},
        {"role": "assistant", "content": response_text}
    ]
    
    return response_text, updated_history
