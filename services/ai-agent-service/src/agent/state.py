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
    # When present, the quiz is grounded on this uploaded-document text (RAG).
    source_text: str = ""
    # When True, the web is consulted (Browser Use) before planning to gather
    # additional, up-to-date information on the topic.
    deep_search: bool = False

    # Pipeline fields
    # Factual notes gathered from the web by the researcher node (deep search).
    web_context: str = ""
    plan: Optional[dict] = None
    raw_questions: Optional[list] = None
    validated_questions: Optional[list] = None
    tags: list[str] = field(default_factory=list)

    # Control fields
    retry_count: int = 0
    error: Optional[str] = None
