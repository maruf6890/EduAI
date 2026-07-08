"""
Quiz generation subgraph. Ported from the standalone quiz_generation_agent.py,
adapted to pull `conn` from sub-state (injected by the caller) instead of a
module-level global, and to use the shared app.llm instances.

Invoked from app/graph/nodes.py::quiz_node as:

    quiz_subgraph_app.invoke({
        "classroom_id": ..., "created_by": ..., "title": ...,
        "description": ..., "scheduled_at": ..., "duration_minutes": ...,
        "topic_scope": ..., "num_questions": ...,
        "conn": ...,
        "max_attempts": 3, "attempts": 0, "validation_errors": [],
    })

Note: quizzes created by this subgraph are always saved as published
(is_published is hardcoded True in create_quiz_by_agent).
"""

from __future__ import annotations

import json
from datetime import datetime
from typing import TypedDict, List, Dict, Any, Optional, Literal, Tuple
from datetime import datetime, UTC
from langgraph.graph import StateGraph, START, END
from pydantic import BaseModel, ValidationError, field_validator
from rank_bm25 import BM25Okapi

from app.agents.llm import llm, embeddings


# ---------------------------------------------------------------------------
# Schema for a generated quiz question
# ---------------------------------------------------------------------------
class QuizQuestionModel(BaseModel):
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: Literal["A", "B", "C", "D"]
    marks: int
    order_index: int

    @field_validator("question_text", "option_a", "option_b", "option_c", "option_d")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("must not be blank")
        return v

    @field_validator("marks")
    @classmethod
    def positive_marks(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("marks must be a positive integer")
        return v


class QuizQuestionsPayload(BaseModel):
    questions: List[QuizQuestionModel]


# ---------------------------------------------------------------------------
# Sub-state
# ---------------------------------------------------------------------------
class QuizAgentState(TypedDict, total=False):
    classroom_id: int
    created_by: int
    title: str
    description: str
    scheduled_at: Any
    duration_minutes: int
    topic_scope: str
    num_questions: int
    conn: Any

    # (chunk_number, content, distance) — 3 columns, matches the SQL SELECT
    vector_results: List[Tuple[int, str, float]]
    # (chunk_id, content, bm25_score)
    keyword_results: List[Tuple[int, str, float]]
    merged_results: List[dict]
    context: str

    raw_output: str
    parsed_questions: Optional[List[Dict[str, Any]]]
    validation_errors: List[str]
    is_valid: bool
    attempts: int
    max_attempts: int

    questions: Optional[List[Dict[str, Any]]]
    quiz_id: Optional[int]
    saved: Optional[bool]
    failure_reason: Optional[str]


# ---------------------------------------------------------------------------
# RAG nodes
# ---------------------------------------------------------------------------
def retrieval_node(state: QuizAgentState) -> QuizAgentState:
    """Vector similarity search over classroom embeddings.

    This is a supplementary retrieval source (keyword_search_node runs in
    parallel and can cover for it), so a DB/embedding failure here should
    degrade to "no vector results" rather than aborting the whole subgraph.
    """
    conn = state["conn"]
    curr = conn.cursor()
    query = state.get("topic_scope") or state["title"]
    results: List[Tuple[int, str, float]] = []
    try:
        query_vector = embeddings.embed_query(query)
        curr.execute(
            """
            SELECT
            e.chunk_number, e.content,
            e.embedding <=> %s::vector AS distance
            FROM classroom_embeddings e
            JOIN classroom_documents d ON e.document_id = d.id
            WHERE d.classroom_id = %s
            ORDER BY e.embedding <=> %s::vector
            LIMIT 10;
            """,
            (query_vector, state["classroom_id"], query_vector),
        )
        results = curr.fetchall()
    except Exception as e:
        conn.rollback()
        print(f"quiz_subgraph retrieval failed, rolled back. Error: {e}")
        # Degrade gracefully: return no vector results instead of killing
        # the whole invoke() call. build_context_node / generate_questions_node
        # can still proceed using keyword_results (if any) or the title alone.
    finally:
        curr.close()

    return {"vector_results": results}


def keyword_search_node(state: QuizAgentState) -> QuizAgentState:
    """BM25 keyword search over classroom embeddings, in parallel with vector search."""
    conn = state["conn"]
    curr = conn.cursor()
    query = state.get("topic_scope") or state["title"]
    top: List[Tuple[int, str, float]] = []
    try:
        curr.execute(
            """
            SELECT e.id, e.content
            FROM classroom_embeddings e
            JOIN classroom_documents d ON e.document_id = d.id
            WHERE d.classroom_id = %s;
            """,
            (state["classroom_id"],),
        )
        rows = curr.fetchall()
        ids = [r[0] for r in rows]
        docs = [r[1] for r in rows]
        if docs:
            bm25 = BM25Okapi([d.split() for d in docs])
            scores = bm25.get_scores(query.split())
            top = sorted(zip(ids, docs, scores), key=lambda x: x[2], reverse=True)[:10]
    except Exception as e:
        conn.rollback()
        print(f"quiz_subgraph keyword search failed, rolled back. Error: {e}")
        # Same reasoning as retrieval_node: degrade, don't abort.
    finally:
        curr.close()

    return {"keyword_results": top}


def merge_context_node(state: QuizAgentState) -> QuizAgentState:
    """Merge vector + keyword hits, deduping on content itself.

    The two sources reference the same classroom_embeddings rows through
    different identifiers (chunk_number vs. row id), so the only reliable
    way to avoid showing the LLM the same chunk twice is to dedupe on the
    actual text content rather than on those source-specific keys.
    """
    merged: Dict[str, dict] = {}
    for chunk_number, content, distance in state.get("vector_results", []):
        merged.setdefault(content, {"content": content})
    for chunk_id, content, score in state.get("keyword_results", []):
        merged.setdefault(content, {"content": content})
    return {"merged_results": list(merged.values())}


def build_context_node(state: QuizAgentState) -> QuizAgentState:
    chunks = state.get("merged_results", [])
    context = "\n\n---\n\n".join(
        f"{c['content']}"
        for c in chunks
    )
    return {"context": context}


# ---------------------------------------------------------------------------
# Generation / validation / retry loop
# ---------------------------------------------------------------------------
QUESTION_SCHEMA_INSTRUCTIONS = """
Return ONLY valid JSON (no markdown fences, no commentary) matching exactly
this shape:

{
  "questions": [
    {
      "question_text": "<string>",
      "option_a": "<string>",
      "option_b": "<string>",
      "option_c": "<string>",
      "option_d": "<string>",
      "correct_option": "A|B|C|D",
      "marks": <positive integer>,
      "order_index": <integer, starting at 1, sequential, unique>
    }
  ]
}

Rules:
- Base every question strictly on the provided context. Do not invent facts
  that aren't supported by it.
- Exactly one correct_option per question, one of "A", "B", "C", "D".
- All four options must be distinct and plausible.
- order_index must start at 1 and increase by 1 with no gaps or duplicates.
- Generate exactly the requested number of questions.
""".strip()


def generate_questions_node(state: QuizAgentState) -> QuizAgentState:
    attempts = state.get("attempts", 0) + 1

    prompt_parts = [
        f"Generate {state.get('num_questions', 5)} multiple-choice quiz "
        f"questions for a quiz titled \"{state['title']}\", covering: "
        f"{state.get('topic_scope') or state['title']}.",
        f"Context (source material to base questions on):\n{state.get('context', '')}",
        QUESTION_SCHEMA_INSTRUCTIONS,
    ]

    if state.get("validation_errors"):
        errors_block = "\n".join(f"- {e}" for e in state["validation_errors"])
        prompt_parts.append(
            "Your previous attempt was invalid for these reasons:\n"
            f"{errors_block}\n"
            "Fix these issues and return corrected JSON only."
        )

    prompt = "\n\n".join(prompt_parts)
    raw_output = llm.invoke(prompt).content

    return {"raw_output": raw_output, "attempts": attempts}


def parse_questions_node(state: QuizAgentState) -> QuizAgentState:
    raw_output = state.get("raw_output", "")
    cleaned = raw_output.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()

    try:
        parsed = json.loads(cleaned)
        return {"parsed_questions": parsed, "validation_errors": []}
    except json.JSONDecodeError as e:
        return {"parsed_questions": None, "validation_errors": [f"Output was not valid JSON: {e}"]}


def validate_questions_node(state: QuizAgentState) -> QuizAgentState:
    parsed = state.get("parsed_questions")
    errors: List[str] = list(state.get("validation_errors", []))

    if parsed is None:
        return {"is_valid": False, "validation_errors": errors}

    try:
        payload = QuizQuestionsPayload.model_validate(parsed)
    except ValidationError as e:
        errors.extend(
            f"Schema error: {err['msg']} at {'.'.join(str(p) for p in err['loc'])}"
            for err in e.errors()
        )
        return {"is_valid": False, "validation_errors": errors}

    questions = payload.questions
    expected_count = state.get("num_questions", 5)

    if len(questions) != expected_count:
        errors.append(f"Expected {expected_count} questions, got {len(questions)}.")

    order_indexes = sorted(q.order_index for q in questions)
    if order_indexes != list(range(1, len(questions) + 1)):
        errors.append("order_index values must be unique, start at 1, and have no gaps.")

    for i, q in enumerate(questions, start=1):
        options = {q.option_a, q.option_b, q.option_c, q.option_d}
        if len(options) < 4:
            errors.append(f"Question {i}: all four options must be distinct.")

    return {"is_valid": len(errors) == 0, "validation_errors": errors}


def route_after_validation(state: QuizAgentState) -> str:
    if state.get("is_valid"):
        return "success"
    if state.get("attempts", 0) >= state.get("max_attempts", 3):
        return "give_up"
    return "retry"


def finalize_failure_node(state: QuizAgentState) -> QuizAgentState:
    errors = state.get("validation_errors", [])
    reason = (
        f"Failed to generate a valid quiz after {state.get('attempts', 0)} attempts. "
        f"Last errors: {'; '.join(errors)}"
    )
    return {"questions": None, "saved": False, "failure_reason": reason}


# ---------------------------------------------------------------------------
# Persistence
# ---------------------------------------------------------------------------
def save_quiz_node(state: QuizAgentState) -> QuizAgentState:
    try:
        payload = QuizQuestionsPayload.model_validate(state["parsed_questions"])
    except ValidationError as e:
        return {
            "questions": None,
            "quiz_id": None,
            "saved": False,
            "failure_reason": f"parsed_questions failed re-validation before save: {e}",
        }

    questions = [q.model_dump() for q in payload.questions]

    success, quiz_id = create_quiz_by_agent(
        conn=state["conn"],
        classroom_id=state["classroom_id"],
        created_by=state["created_by"],
        title=state["title"],
        description=state.get("description", ""),
        scheduled_at=state["scheduled_at"],
        duration_minutes=state["duration_minutes"],
        questions=questions,
    )

    return {
        "questions": questions,
        "quiz_id": quiz_id,
        "saved": success,
        "failure_reason": None if success else "create_quiz_by_agent failed to insert the quiz",
    }


def create_quiz_by_agent(
    conn,
    classroom_id: int,
    created_by: int,
    title: str,
    description: str,
    scheduled_at,
    duration_minutes: int,
    questions: list,
) -> Tuple[bool, Optional[int]]:
    """Insert a quiz and its questions in a single transaction.

    Returns (success, quiz_id). quiz_id is None on failure.

    is_published is intentionally always True for agent-created quizzes.
    total_marks is computed as the sum of each question's marks.

    Expects tables:
      quizzes(id, classroom_id, created_by, title, description,
              scheduled_at, duration_minutes, is_published, created_at,
              total_marks)
      quiz_questions(id, quiz_id, question_text, option_a, option_b,
                     option_c, option_d, correct_option, marks, order_index)
    """
    curr = conn.cursor()
    try:
        curr.execute(
            """
            INSERT INTO quizzes (
                classroom_id, created_by, title, description,
                scheduled_at, duration_minutes, is_published, created_at,total_marks
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s,%s)
            RETURNING id;
            """,
            (
                classroom_id, created_by, title, description,
                scheduled_at, duration_minutes, True, datetime.now(UTC),sum(q["marks"] for q in questions)
            ),
        )
        quiz_id = curr.fetchone()[0]

        for q in questions:
            curr.execute(
                """
                INSERT INTO quiz_questions (
                    quiz_id, question_text, option_a, option_b, option_c,
                    option_d, correct_option, marks, order_index
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
                """,
                (
                    quiz_id, q["question_text"], q["option_a"], q["option_b"],
                    q["option_c"], q["option_d"], q["correct_option"],
                    q["marks"], q["order_index"],
                ),
            )

        conn.commit()
        return True, quiz_id

    except Exception as e:
        conn.rollback()
        print(f"create_quiz_by_agent failed, rolled back. Error: {e}")
        return False, None

    finally:
        curr.close()


# ---------------------------------------------------------------------------
# Graph assembly
# ---------------------------------------------------------------------------
def build_quiz_subgraph():
    graph = StateGraph(QuizAgentState)

    graph.add_node("retrieval", retrieval_node)
    graph.add_node("keyword_search", keyword_search_node)
    graph.add_node("merge_context", merge_context_node)
    graph.add_node("build_context", build_context_node)
    graph.add_node("generate_questions", generate_questions_node)
    graph.add_node("parse_questions", parse_questions_node)
    graph.add_node("validate_questions", validate_questions_node)
    graph.add_node("save_quiz", save_quiz_node)
    graph.add_node("finalize_failure", finalize_failure_node)

    graph.add_edge(START, "retrieval")
    graph.add_edge(START, "keyword_search")
    graph.add_edge("retrieval", "merge_context")
    graph.add_edge("keyword_search", "merge_context")
    graph.add_edge("merge_context", "build_context")
    graph.add_edge("build_context", "generate_questions")
    graph.add_edge("generate_questions", "parse_questions")
    graph.add_edge("parse_questions", "validate_questions")

    graph.add_conditional_edges(
        "validate_questions",
        route_after_validation,
        {"success": "save_quiz", "retry": "generate_questions", "give_up": "finalize_failure"},
    )

    graph.add_edge("save_quiz", END)
    graph.add_edge("finalize_failure", END)

    return graph.compile()


quiz_subgraph_app = build_quiz_subgraph()