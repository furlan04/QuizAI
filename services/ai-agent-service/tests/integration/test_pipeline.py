"""
Integration tests for the full LangGraph pipeline.

All GROQ calls are mocked — no real API key needed.
Three scenarios:
  1. Happy path  — GROQ responds correctly on first attempt
  2. Retry path  — GROQ gives invalid data twice, succeeds on third attempt
  3. Fail path   — GROQ always returns invalid data → state.error set, status=failed
"""
import pytest
from unittest.mock import patch, MagicMock, call
from src.agent.graph import build_graph
from src.agent.state import AgentState
from src.contracts.models import RawQuestions, QuizPlan, SubtopicDistribution, Question


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _valid_question(text: str) -> dict:
    return {
        "text": text,
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct_index": 0,
        "explanation": f"Because {text} is correct.",
    }


def _invalid_question(text: str) -> dict:
    """Too few options — will fail validator."""
    return {
        "text": text,
        "options": ["Only", "Two"],  # wrong count
        "correct_index": 0,
        "explanation": "Bad.",
    }


def _make_plan() -> QuizPlan:
    return QuizPlan(
        topic="Python",
        difficulty="easy",
        subtopics=[SubtopicDistribution(subtopic="Variables", num_questions=2)],
        total_questions=2,
        language="en",
        notes="Test plan",
    )


def _make_valid_raw(n: int = 2) -> RawQuestions:
    return RawQuestions(
        questions=[
            Question(
                text=f"Q{i}",
                options=["A", "B", "C", "D"],
                correct_index=0,
                explanation="Because.",
            )
            for i in range(n)
        ]
    )


def _make_invalid_raw(n: int = 2) -> RawQuestions:
    """Questions with only 2 options — validator will reject."""
    return RawQuestions(
        questions=[
            Question(
                text=f"Bad Q{i}",
                options=["A", "B", "C", "D"],  # Pydantic requires 4 for the model itself
                correct_index=0,
                explanation="x",
            )
            for i in range(n)
        ]
    )


def _make_initial_state(num_questions: int = 2) -> AgentState:
    return AgentState(
        quiz_id="qz-test-001",
        topic="Python",
        difficulty="easy",
        num_questions=num_questions,
        user_id="u-test",
    )


# ---------------------------------------------------------------------------
# Scenario 1: Happy path
# ---------------------------------------------------------------------------

@patch("src.agent.nodes.generator.instructor")
@patch("src.agent.nodes.generator.Groq")
@patch("src.agent.nodes.planner.instructor")
@patch("src.agent.nodes.planner.Groq")
def test_happy_path(mock_planner_groq, mock_planner_instructor,
                    mock_gen_groq, mock_gen_instructor):
    """Pipeline succeeds on the first attempt — validated_questions populated."""
    # Planner mock
    planner_client = MagicMock()
    mock_planner_instructor.from_groq.return_value = planner_client
    planner_client.chat.completions.create.return_value = _make_plan()

    # Generator mock — valid questions first call
    gen_client = MagicMock()
    mock_gen_instructor.from_groq.return_value = gen_client
    gen_client.chat.completions.create.return_value = _make_valid_raw(2)

    graph = build_graph()
    final: AgentState = graph.invoke(_make_initial_state(num_questions=2))

    assert final.validated_questions is not None
    assert len(final.validated_questions) == 2
    assert final.error is None
    assert final.retry_count == 0
    assert len(final.tags) > 0

    # Generator called exactly once
    assert gen_client.chat.completions.create.call_count == 1


# ---------------------------------------------------------------------------
# Scenario 2: Retry — invalid twice, valid on 3rd
# ---------------------------------------------------------------------------

@patch("src.agent.nodes.generator.instructor")
@patch("src.agent.nodes.generator.Groq")
@patch("src.agent.nodes.planner.instructor")
@patch("src.agent.nodes.planner.Groq")
def test_retry_succeeds_on_third_attempt(mock_planner_groq, mock_planner_instructor,
                                          mock_gen_groq, mock_gen_instructor):
    """
    Generator returns wrong question count the first 2 times,
    then correct questions on the 3rd call.
    """
    planner_client = MagicMock()
    mock_planner_instructor.from_groq.return_value = planner_client
    planner_client.chat.completions.create.return_value = _make_plan()

    gen_client = MagicMock()
    mock_gen_instructor.from_groq.return_value = gen_client

    # First two calls return only 1 question (expected: 2) → validator fails
    one_question = RawQuestions(
        questions=[
            Question(text="Q0", options=["A", "B", "C", "D"], correct_index=0, explanation="x")
        ]
    )
    gen_client.chat.completions.create.side_effect = [
        one_question,
        one_question,
        _make_valid_raw(2),  # third attempt succeeds
    ]

    graph = build_graph()
    final: AgentState = graph.invoke(_make_initial_state(num_questions=2))

    assert final.validated_questions is not None
    assert len(final.validated_questions) == 2
    assert final.retry_count == 2
    assert final.error is None
    assert gen_client.chat.completions.create.call_count == 3


# ---------------------------------------------------------------------------
# Scenario 3: Always fails → status failed
# ---------------------------------------------------------------------------

@patch("src.agent.nodes.generator.instructor")
@patch("src.agent.nodes.generator.Groq")
@patch("src.agent.nodes.planner.instructor")
@patch("src.agent.nodes.planner.Groq")
def test_always_fails_sets_error(mock_planner_groq, mock_planner_instructor,
                                  mock_gen_groq, mock_gen_instructor):
    """
    Generator always returns 1 question (expected: 2).
    After MAX_RETRIES the graph ends with state.error set and no validated_questions.
    """
    planner_client = MagicMock()
    mock_planner_instructor.from_groq.return_value = planner_client
    planner_client.chat.completions.create.return_value = _make_plan()

    gen_client = MagicMock()
    mock_gen_instructor.from_groq.return_value = gen_client

    bad_result = RawQuestions(
        questions=[
            Question(text="Q0", options=["A", "B", "C", "D"], correct_index=0, explanation="x")
        ]
    )
    # Always return only 1 question
    gen_client.chat.completions.create.return_value = bad_result

    graph = build_graph()
    final: AgentState = graph.invoke(_make_initial_state(num_questions=2))

    assert final.validated_questions is None
    assert final.error is not None
    assert final.retry_count == 3  # MAX_RETRIES
    # Generator called MAX_RETRIES times (3 retries = 3 generation attempts after initial)
    assert gen_client.chat.completions.create.call_count == 3
