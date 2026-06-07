from pydantic import BaseModel, Field
from typing import Literal, Optional
from .models import Question


class QuizGenerateEvent(BaseModel):
    """Incoming event from quiz.generate queue."""

    quiz_id: str
    topic: str = Field(max_length=200)
    difficulty: Literal["easy", "medium", "hard"]
    num_questions: int = Field(ge=1, le=20)
    user_id: str
    # Optional: extracted text of an uploaded document to ground the quiz on.
    source_text: Optional[str] = Field(default=None, max_length=60000)
    # Optional: when True, consult the web (deep search) before generating to
    # enrich the quiz with additional information on the topic.
    deep_search: bool = Field(default=False)


class QuizGeneratedEvent(BaseModel):
    """Outgoing event published to quiz.generated queue."""

    quiz_id: str
    status: Literal["ready", "failed"]
    questions: list[Question] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    error: Optional[str] = None
