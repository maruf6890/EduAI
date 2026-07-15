from __future__ import annotations
import json
from typing import List, Dict, Any, Optional, Literal

from loguru import logger
from pydantic import BaseModel, ValidationError, Field

from app.ai.utils.llm import text_to_text, GeminiServiceError

NodeType = Literal[
    "start",
    "topic",
    "practice",
    "assessment",
    "milestone",
    "end",
]


class Position(BaseModel):
    x: float
    y: float


class NodeData(BaseModel):
    label: str


class ReactFlowNode(BaseModel):
    id: str
    type: NodeType
    position: Position
    data: NodeData


class ReactFlowEdge(BaseModel):
    id: str
    source: str
    target: str
    animated: bool


class ReactFlowFlow(BaseModel):
    nodes: List[ReactFlowNode]
    edges: List[ReactFlowEdge]


class ReactFlowGraph(BaseModel):
    title: str
    flow: ReactFlowFlow


class PlannerResult(BaseModel):
    final_plan: Optional[Dict[str, Any]] = None
    failure_reason: Optional[str] = None
    attempts: int = 0


PLANNER_SYSTEM_PROMPT = """
You are a curriculum planning assistant. Given a topic, produce a learning workflow plan as a
directed graph suitable for rendering with React Flow.

Rules:
- Exactly one node with type "start" and exactly one node with type "end".
- Every node id must be unique.
- Every edge "source" and "target" must reference an existing node id.
- Every node must be reachable from the "start" node.
- The graph must be a valid directed learning path with no isolated nodes.
- Use meaningful, human-readable labels inside data.label.
- Position nodes in a top-to-bottom layout: keep x consistent (e.g. 300) and increase y by
  150-200 for each subsequent node.
- Edge ids must be unique strings (e.g. "e-start-node_js_intro").
- Produce a logical learning progression: start → topics → practice → milestone(s) → assessment → end.
- Include 8–16 nodes depending on the topic's complexity.

Always return your answer strictly following the provided schema.
""".strip()


def _validate_plan(parsed: Dict[str, Any]) -> tuple[Optional[ReactFlowGraph], List[str]]:
    """Validate a parsed plan dict against the schema and graph-structure rules."""
    errors: List[str] = []

    try:
        plan = ReactFlowGraph.model_validate(parsed)
    except ValidationError as e:
        errors.extend(
            f"Schema error: {err['msg']} at {'.'.join(str(p) for p in err['loc'])}"
            for err in e.errors()
        )
        return None, errors

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
        if edge.source not in node_id_set:
            errors.append(f"Edge references unknown 'source' id: {edge.source}")
        if edge.target not in node_id_set:
            errors.append(f"Edge references unknown 'target' id: {edge.target}")

    if start_nodes and not errors:
        adjacency: Dict[str, List[str]] = {}
        for edge in edges:
            adjacency.setdefault(edge.source, []).append(edge.target)

        visited = set()
        stack = [start_nodes[0].id]
        while stack:
            current = stack.pop()
            if current in visited:
                continue
            visited.add(current)
            stack.extend(adjacency.get(current, []))

        unreachable = node_id_set - visited
        if unreachable:
            errors.append(f"Nodes unreachable from start: {sorted(unreachable)}")

    return (plan if not errors else None), errors


def generate_learning_plan(
    topic: str,
    max_attempts: int = 3,
) -> PlannerResult:
    """
    Generate a validated React Flow learning-path plan for a topic using Gemini,
    retrying with error feedback if the output is invalid.

    Args:
        topic: The subject to build a learning path for.
        max_attempts: Max number of generate/validate retries before giving up.

    Returns:
        PlannerResult with either a valid final_plan, or a failure_reason after
        exhausting attempts.
    """
    raw_output: Optional[str] = None
    validation_errors: List[str] = []
    attempts = 0

    while attempts < max_attempts:
        attempts += 1

        prompt_parts = [f'Create a learning workflow plan for the topic: "{topic}".']

        if validation_errors:
            errors_block = "\n".join(f"- {e}" for e in validation_errors)
            prompt_parts.append(
                "Your previous attempt was invalid for these reasons:\n"
                f"{errors_block}\n"
                "Fix these issues in your next attempt."
            )
            if raw_output:
                prompt_parts.append(f"Previous attempt:\n{raw_output}")

        input_text = "\n\n".join(prompt_parts)

        try:
            plan: ReactFlowGraph = text_to_text(
                input_text=input_text,
                system_prompt=PLANNER_SYSTEM_PROMPT,
                output_format=ReactFlowGraph,
            )
        except GeminiServiceError as e:
            logger.error(f"LLM call failed on attempt {attempts} for topic '{topic}': {e.message}")
            validation_errors = [f"LLM call failed: {e.message}"]
            raw_output = None
            continue

        if plan is None:
            validation_errors = ["LLM returned no output."]
            continue

        raw_output = plan.model_dump_json()
        validated_plan, errors = _validate_plan(json.loads(raw_output))

        if validated_plan is not None:
            logger.info(f"Valid plan generated for topic '{topic}' after {attempts} attempt(s).")
            return PlannerResult(final_plan=validated_plan.model_dump(), attempts=attempts)

        validation_errors = errors
        logger.warning(f"Attempt {attempts} invalid for topic '{topic}': {errors}")

    reason = (
        f"Failed to produce a valid plan after {attempts} attempts. "
        f"Last errors: {'; '.join(validation_errors)}"
    )
    logger.error(reason)
    return PlannerResult(final_plan=None, failure_reason=reason, attempts=attempts)