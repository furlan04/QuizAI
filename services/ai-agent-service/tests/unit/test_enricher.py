"""Unit tests for the enricher node."""
import pytest
from src.agent.state import AgentState
from src.agent.nodes.enricher import enricher_node


def _make_state(topic="Python programming", difficulty="medium", validated_questions=None) -> AgentState:
    plan = {
        "topic": topic,
        "difficulty": difficulty,
        "subtopics": [],
        "total_questions": 2,
        "language": "en",
        "notes": None,
    }
    return AgentState(
        quiz_id="qz-001",
        topic=topic,
        difficulty=difficulty,
        num_questions=2,
        user_id="u-1",
        plan=plan,
        validated_questions=validated_questions or [
            {
                "text": "What is Python?",
                "options": ["A snake", "A language", "A movie", "A book"],
                "correct_index": 1,
                "explanation": "Python is a programming language.",
            }
        ],
    )


def test_enricher_adds_tags():
    state = _make_state(topic="Python programming")
    result = enricher_node(state)

    assert len(result["tags"]) > 0
    assert "python" in result["tags"]
    assert "programming" in result["tags"]


def test_enricher_adds_difficulty_tag():
    state = _make_state(difficulty="hard")
    result = enricher_node(state)
    assert "hard" in result["tags"]


def test_enricher_adds_lang_tag():
    state = _make_state()
    result = enricher_node(state)
    assert "lang:en" in result["tags"]


def test_enricher_adds_metadata_to_questions():
    state = _make_state()
    result = enricher_node(state)

    for q in result["validated_questions"]:
        assert "metadata" in q
        assert q["metadata"]["language"] == "en"
        assert "generated_at" in q["metadata"]
        assert q["metadata"]["difficulty"] == "medium"


def test_enricher_does_not_crash_on_empty_questions():
    state = _make_state(validated_questions=[])
    result = enricher_node(state)
    assert "error" not in result
    assert isinstance(result["tags"], list)


def test_enricher_topic_normalised_as_tag():
    state = _make_state(topic="World History")
    result = enricher_node(state)
    assert "world-history" in result["tags"]
