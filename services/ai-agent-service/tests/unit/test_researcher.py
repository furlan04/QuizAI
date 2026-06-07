"""Unit tests for the deep-search researcher node and Browser Use client."""
from unittest.mock import patch, MagicMock

import httpx

from src.agent.state import AgentState
from src.agent.nodes.researcher import researcher_node


def _make_state(**kwargs) -> AgentState:
    defaults = dict(
        quiz_id="qz-001",
        topic="Quantum computing",
        difficulty="medium",
        num_questions=5,
        user_id="u-1",
        deep_search=True,
    )
    defaults.update(kwargs)
    return AgentState(**defaults)


@patch("src.agent.nodes.researcher.research_topic")
def test_researcher_returns_web_context(mock_research):
    mock_research.return_value = "Qubits exploit superposition."
    result = researcher_node(_make_state())

    assert result == {"web_context": "Qubits exploit superposition."}
    mock_research.assert_called_once_with("Quantum computing", "medium")


@patch("src.agent.nodes.researcher.research_topic")
def test_researcher_skips_when_document_present(mock_research):
    """Document-grounded quizzes never trigger web research."""
    result = researcher_node(_make_state(source_text="Some uploaded document text"))

    assert result == {"web_context": ""}
    mock_research.assert_not_called()


@patch("src.agent.nodes.researcher.research_topic")
def test_researcher_degrades_gracefully_on_error(mock_research):
    """A failing web search must not break the pipeline."""
    mock_research.side_effect = RuntimeError("network down")
    result = researcher_node(_make_state())

    assert result == {"web_context": ""}


@patch("src.infrastructure.browser_use_client.settings")
def test_research_topic_disabled_without_api_key(mock_settings):
    from src.infrastructure import browser_use_client

    mock_settings.browser_use_api_key = ""
    assert browser_use_client.research_topic("anything", "easy") == ""


@patch("src.infrastructure.browser_use_client.httpx")
@patch("src.infrastructure.browser_use_client.settings")
def test_research_topic_runs_and_polls(mock_settings, mock_httpx):
    from src.infrastructure import browser_use_client

    mock_settings.browser_use_api_key = "key-123"
    mock_settings.browser_use_base_url = "https://api.browser-use.com"
    mock_settings.browser_use_timeout = 30.0
    mock_settings.browser_use_poll_interval = 0
    mock_settings.deep_search_context_chars = 6000

    client = MagicMock()
    mock_httpx.Client.return_value.__enter__.return_value = client
    # httpx.HTTPError must stay a real exception type for the except clause.
    mock_httpx.HTTPError = httpx.HTTPError

    run_resp = MagicMock()
    run_resp.json.return_value = {"id": "task-1"}
    client.post.return_value = run_resp

    status_resp = MagicMock()
    status_resp.json.return_value = {"status": "finished", "output": "Key facts here."}
    client.get.return_value = status_resp

    result = browser_use_client.research_topic("Black holes", "hard")

    assert result == "Key facts here."
    client.post.assert_called_once()
    client.get.assert_called_once()
