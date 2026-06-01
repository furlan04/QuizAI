"""Unit tests for the planner node."""
import pytest
from unittest.mock import patch, MagicMock
from src.agent.state import AgentState
from src.agent.nodes.planner import planner_node
from src.contracts.models import QuizPlan, SubtopicDistribution


def _make_state(**kwargs) -> AgentState:
    defaults = dict(
        quiz_id="qz-001",
        topic="Python basics",
        difficulty="easy",
        num_questions=5,
        user_id="u-1",
    )
    defaults.update(kwargs)
    return AgentState(**defaults)


def _mock_plan(topic="Python basics", difficulty="easy", num_questions=5) -> QuizPlan:
    subtopics = [
        SubtopicDistribution(subtopic="Variables", num_questions=2),
        SubtopicDistribution(subtopic="Functions", num_questions=3),
    ]
    return QuizPlan(
        topic=topic,
        difficulty=difficulty,
        subtopics=subtopics,
        total_questions=num_questions,
        language="en",
        notes="Introductory quiz",
    )


@patch("src.agent.nodes.planner.instructor")
@patch("src.agent.nodes.planner.Groq")
def test_planner_happy_path(mock_groq, mock_instructor):
    """Planner returns a dict with plan on successful LLM call."""
    mock_client = MagicMock()
    mock_instructor.from_groq.return_value = mock_client
    mock_client.chat.completions.create.return_value = _mock_plan()

    state = _make_state()
    result = planner_node(state)

    assert "plan" in result
    assert result["plan"]["topic"] == "Python basics"
    assert len(result["plan"]["subtopics"]) == 2
    assert "error" not in result  # not set on success


@patch("src.agent.nodes.planner.instructor")
@patch("src.agent.nodes.planner.Groq")
def test_planner_sets_error_on_exception(mock_groq, mock_instructor):
    """Planner returns error key without raising."""
    mock_client = MagicMock()
    mock_instructor.from_groq.return_value = mock_client
    mock_client.chat.completions.create.side_effect = RuntimeError("LLM timeout")

    state = _make_state()
    result = planner_node(state)

    assert "plan" not in result
    assert "Planner failed" in result["error"]


@patch("src.agent.nodes.planner.instructor")
@patch("src.agent.nodes.planner.Groq")
def test_planner_does_not_mutate_state(mock_groq, mock_instructor):
    """Node returns a dict; the input state is not modified."""
    mock_client = MagicMock()
    mock_instructor.from_groq.return_value = mock_client
    mock_client.chat.completions.create.return_value = _mock_plan()

    state = _make_state(quiz_id="qz-xyz-999")
    planner_node(state)

    # State object itself should be untouched
    assert state.plan is None
    assert state.quiz_id == "qz-xyz-999"
