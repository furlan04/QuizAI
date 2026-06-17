from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any
from ...agent.buddy import generate_chat_response
from ...contracts.schema_validator import validate_input

router = APIRouter(prefix="/buddy", tags=["buddy"])

class ChatRequest(BaseModel):
    session_id: str
    user_id: str
    message: str
    history: List[Dict[str, Any]] = []

class ChatResponse(BaseModel):
    response: str
    updated_history: List[Dict[str, Any]]

@router.post("/chat", response_model=ChatResponse)
async def buddy_chat(request: ChatRequest):
    try:
        response_text, updated_history = await generate_chat_response(
            session_id=request.session_id,
            user_id=request.user_id,
            message=request.message,
            history=request.history
        )
        return ChatResponse(
            response=response_text,
            updated_history=updated_history
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Buddy chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
