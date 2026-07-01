"""
Workflow-planning subgraph. Ported from the standalone
workflow_planner_graph.py, adapted to use the shared app.llm instance.

Invoked from app/graph/nodes.py::planner_node as:

    planner_subgraph_app.invoke({
        "topic": ..., "max_attempts": 3, "attempts": 0, "validation_errors": [],
    })
"""

from __future__ import annotations

import json
from typing import TypedDict, List, Dict, Any, Optional, Literal

from langgraph.graph import StateGraph, START, END
from pydantic import BaseModel, ValidationError

from app.llm import llm

NodeType = Literal["start", "topic", "practice", "assessment", "milestone", "end"]


class NodeModel(BaseModel):
    id: str
    type: NodeType
    label: str


class EdgeModel(BaseModel):
    from_: str
    to: str

    class Config:
        populate_by_name = True
        fields = {"from_": "from"}


class FlowModel(BaseModel):
    nodes: List[NodeModel]
    edges: List[EdgeModel]


class WorkflowPlan(BaseModel):
    title: str
    flow: FlowModel


class PlannerState(TypedDict, total=False):
    topic: str
    raw_output: str
    parsed_plan: Optional[Dict[str, Any]]
    validation_errors: List[str]
    is_valid: bool
    attempts: int
    max_attempts: int
    final_plan: Optional[Dict[str, Any]]
    failure_reason: Optional[str]


PLAN_SCHEMA_INSTRUCTIONS = """
Return ONLY valid JSON (no markdown fences, no commentary) matching exactly
this shape:

{
  "title": "<string>",
  "flow": {
    "nodes": [
      {"id": "<string>", "type": "start|topic|practice|assessment|milestone|end", "label": "<string>"}
    ],
    "edges": [
      {"from": "<node id>", "to": "<node id>"}
    ]
  }
}

Rules:
- Exactly one node with type "start" and exactly one node with type "end".
- Every "from" and "to" value in edges must reference an existing node id.
- Every node must be reachable from the "start" node by following edges.
- Node ids must be unique strings.
- Produce a reasonable, ordered learning path: start -> topics -> practice
  -> assessment -> end (mixing in milestones where useful).
""".strip()


def generate_plan_node(state: PlannerState) -> PlannerState:
    topic = state["topic"]
    attempts = state.get("attempts", 0) + 1

    prompt_parts = [
        f"Create a learning workflow plan for the topic: \"{topic}\".",
        PLAN_SCHEMA_INSTRUCTIONS,
    ]

    if state.get("validation_errors"):
        errors_block = "\n".join(f"- {e}" for e in state["validation_errors"])
        prompt_parts.append(
            "Your previous attempt was invalid for these reasons:\n"
            f"{errors_block}\n"
            "Fix these issues and return corrected JSON only."
        )
        if state.get("raw_output"):
            prompt_parts.append(f"Previous attempt:\n{state['raw_output']}")

    prompt = "\n\n".join(prompt_parts)
    raw_output = llm.invoke(prompt).content

    return {"raw_output": raw_output, "attempts": attempts}


def parse_plan_node(state: PlannerState) -> PlannerState:
    raw_output = state.get("raw_output", "")
    cleaned = raw_output.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()

    try:
        parsed = json.loads(cleaned)
        return {"parsed_plan": parsed, "validation_errors": []}
    except json.JSONDecodeError as e:
        return {"parsed_plan": None, "validation_errors": [f"Output was not valid JSON: {e}"]}


def validate_plan_node(state: PlannerState) -> PlannerState:
    parsed = state.get("parsed_plan")
    errors: List[str] = list(state.get("validation_errors", []))

    if parsed is None:
        return {"is_valid": False, "validation_errors": errors}

    try:
        plan = WorkflowPlan.model_validate(parsed)
    except ValidationError as e:
        errors.extend(f"Schema error: {err['msg']} at {'.'.join(str(p) for p in err['loc'])}" for err in e.errors())
        return {"is_valid": False, "validation_errors": errors}

    nodes = plan.flow.nodes
    edges = plan.flow.edges
    node_ids = [n.id for n in nodes]
    node_id_set = set(node_ids)

    if len(node_ids) != len(node_id_set):
        errors.append("Duplicate node ids found.")

    start_nodes = [n for n in nodes if n.type == "start"]
    end_nodes = [n for n in nodes if n.type == "end"]
    if len(start_nodes) != 1:
        errors.append(f"Expected exactly 1 'start' node, found {len(start_nodes)}.")
    if len(end_nodes) != 1:
        errors.append(f"Expected exactly 1 'end' node, found {len(end_nodes)}.")

    for edge in edges:
        if edge.from_ not in node_id_set:
            errors.append(f"Edge references unknown 'from' id: {edge.from_}")
        if edge.to not in node_id_set:
            errors.append(f"Edge references unknown 'to' id: {edge.to}")

    if start_nodes and not errors:
        adjacency: Dict[str, List[str]] = {}
        for edge in edges:
            adjacency.setdefault(edge.from_, []).append(edge.to)

        visited = set()
        queue = [start_nodes[0].id]
        while queue:
            current = queue.pop()
            if current in visited:
                continue
            visited.add(current)
            queue.extend(adjacency.get(current, []))

        unreachable = node_id_set - visited
        if unreachable:
            errors.append(f"Nodes unreachable from start: {sorted(unreachable)}")

    return {"is_valid": len(errors) == 0, "validation_errors": errors}


def route_after_validation(state: PlannerState) -> str:
    if state.get("is_valid"):
        return "success"
    if state.get("attempts", 0) >= state.get("max_attempts", 3):
        return "give_up"
    return "retry"


def finalize_success_node(state: PlannerState) -> PlannerState:
    return {"final_plan": state["parsed_plan"], "failure_reason": None}


def finalize_failure_node(state: PlannerState) -> PlannerState:
    errors = state.get("validation_errors", [])
    reason = (
        f"Failed to produce a valid plan after {state.get('attempts', 0)} attempts. "
        f"Last errors: {'; '.join(errors)}"
    )
    return {"final_plan": None, "failure_reason": reason}


def build_planner_subgraph():
    graph = StateGraph(PlannerState)

    graph.add_node("generate_plan", generate_plan_node)
    graph.add_node("parse_plan", parse_plan_node)
    graph.add_node("validate_plan", validate_plan_node)
    graph.add_node("finalize_success", finalize_success_node)
    graph.add_node("finalize_failure", finalize_failure_node)

    graph.add_edge(START, "generate_plan")
    graph.add_edge("generate_plan", "parse_plan")
    graph.add_edge("parse_plan", "validate_plan")

    graph.add_conditional_edges(
        "validate_plan",
        route_after_validation,
        {"success": "finalize_success", "retry": "generate_plan", "give_up": "finalize_failure"},
    )

    graph.add_edge("finalize_success", END)
    graph.add_edge("finalize_failure", END)

    return graph.compile()


planner_subgraph_app = build_planner_subgraph()
