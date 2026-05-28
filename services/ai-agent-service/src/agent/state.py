from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class AgentState:
    # Input fields
    quiz_id: str = ""
    topic: str = ""
    difficulty: str = ""
    num_questions: int = 0
    user_id: str = ""

    # Pipeline fields
    plan: Optional[dict] = None
    raw_questions: Optional[list] = None
    validated_questions: Optional[list] = None
    tags: list[str] = field(default_factory=list)

    # Control fields
    retry_count: int = 0
    error: Optional[str] = None
