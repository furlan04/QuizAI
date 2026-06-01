from pydantic import BaseModel, Field
from typing import Optional


class Question(BaseModel):
    text: str
    options: list[str] = Field(min_length=4, max_length=4)
    correct_index: int = Field(ge=0, le=3)
    explanation: str


class SubtopicDistribution(BaseModel):
    subtopic: str
    num_questions: int


class QuizPlan(BaseModel):
    topic: str
    difficulty: str
    subtopics: list[SubtopicDistribution]
    total_questions: int
    language: str = "en"
    notes: Optional[str] = None


class RawQuestions(BaseModel):
    questions: list[Question]
