"""Unit tests for the validator node and routing function."""
import pytest
from src.agent.state import AgentState
from src.agent.nodes.validator import validator_node, should_retry


def _make_question(
    text="What is Python?",
    options=None,
    correct_index=0,
    explanation="Because it is.",
) -> dict:
    return {
        "text": text,
        "options": options or ["A snake", "A language", "A movie", "A book"],
        "correct_index": correct_index,
        "explanation": explanation,
    }


def _make_state(raw_questions=None, num_questions=2, retry_count=0, error=None) -> AgentState:
    return AgentState(
        quiz_id="qz-001",
        topic="Python",
        difficulty="easy",
        num_questions=num_questions,
        user_id="u-1",
        raw_questions=raw_questions,
        retry_count=retry_count,
        error=error,
    )


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------

def test_validator_passes_valid_questions():
    questions = [_make_question(text=f"Q{i}") for i in range(2)]
    state = _make_state(raw_questions=questions)
    result = validator_node(state)

    assert result["validated_questions"] == questions
    assert result["error"] is None
    assert "retry_count" not in result  # not touched on success


def test_should_retry_returns_done_on_success():
    state = _make_state()
    state.validated_questions = [_make_question()]
    assert should_retry(state) == "done"


# ---------------------------------------------------------------------------
# Wrong count
# ---------------------------------------------------------------------------

def test_validator_fails_on_wrong_count():
    questions = [_make_question()]  # only 1, but num_questions=2
    state = _make_state(raw_questions=questions, num_questions=2)
    result = validator_node(state)

    assert result["validated_questions"] is None
    assert result["retry_count"] == 1
    assert "Expected 2" in result["error"]


# ---------------------------------------------------------------------------
# Bad correct_index
# ---------------------------------------------------------------------------

def test_validator_fails_on_bad_correct_index():
    q = _make_question(correct_index=5)
    state = _make_state(raw_questions=[q, _make_question(text="Q2")], num_questions=2)
    result = validator_node(state)

    assert result["validated_questions"] is None
    assert "correct_index=5" in result["error"]


# ---------------------------------------------------------------------------
# Duplicate questions
# ---------------------------------------------------------------------------

def test_validator_fails_on_duplicate_text():
    questions = [_make_question(text="Same question?"), _make_question(text="Same question?")]
    state = _make_state(raw_questions=questions, num_questions=2)
    result = validator_node(state)

    assert result["validated_questions"] is None
    assert "duplicate" in result["error"].lower()


# ---------------------------------------------------------------------------
# Retry routing
# ---------------------------------------------------------------------------

def test_should_retry_returns_retry_below_max():
    state = _make_state(retry_count=2)
    state.error = "some error"
    assert should_retry(state) == "retry"


def test_should_retry_returns_fail_at_max():
    state = _make_state(retry_count=3)
    state.error = "still broken"
    assert should_retry(state) == "fail"


# ---------------------------------------------------------------------------
# Too few options
# ---------------------------------------------------------------------------

def test_validator_fails_on_wrong_option_count():
    q = _make_question(options=["Only", "Three", "Options"])
    state = _make_state(raw_questions=[q, _make_question(text="Q2")], num_questions=2)
    result = validator_node(state)

    assert result["validated_questions"] is None
    assert "4 options" in result["error"]
