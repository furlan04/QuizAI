from dataclasses import fields as dataclass_fields
from langgraph.graph import StateGraph, END
from .state import AgentState
from .nodes import (
    planner_node,
    generator_node,
    validator_node,
    should_retry,
    enricher_node,
)

_STATE_FIELDS = {f.name for f in dataclass_fields(AgentState)}


class QuizGraph:
    """
    Wraps the compiled LangGraph graph so that invoke() always returns a
    proper AgentState instead of LangGraph's internal AddableValuesDict.
    """

    def __init__(self, compiled_graph):
        self._graph = compiled_graph

    def invoke(self, state: AgentState) -> AgentState:
        result = self._graph.invoke(state)
        return AgentState(**{k: v for k, v in result.items() if k in _STATE_FIELDS})


def build_graph() -> QuizGraph:
    """
    Assembles and compiles the LangGraph quiz-generation pipeline.

    Flow:
        planner → generator → validator ──(done)──→ enricher → END
                                        ↑─(retry)──┘
                                        └─(fail)──→ END
    """
    builder = StateGraph(AgentState)

    builder.add_node("planner", planner_node)
    builder.add_node("generator", generator_node)
    builder.add_node("validator", validator_node)
    builder.add_node("enricher", enricher_node)

    builder.set_entry_point("planner")
    builder.add_edge("planner", "generator")
    builder.add_edge("generator", "validator")

    builder.add_conditional_edges(
        "validator",
        should_retry,
        {
            "retry": "generator",
            "done": "enricher",
            "fail": END,
        },
    )

    builder.add_edge("enricher", END)

    return QuizGraph(builder.compile())


# Module-level compiled graph — reused across requests
quiz_graph = build_graph()
