
from typing import Optional, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field

from app.agents.llm import embeddings, llm
from app.schemas.chat_schema import SummaryOutput
from app.agents.community_class import classroom_request_store as store

SIMILARITY_THRESHOLD = 0.85

SUMMARY_SYSTEM_PROMPT = """You are helping match a student's question to the right classroom topic.

Write a summary (120-180 words) that:
1. States the core concept the student is actually asking about
2. Places it inside its immediate parent topic
3. Places that inside 1-2 broader/foundational topics it belongs to
4. Mentions closely related concepts a classroom on this subject would also cover

Do not answer the question. Do not include greetings or meta-commentary.
Only output the summary text."""


class ClassroomTopicOutput(BaseModel):
    """Separate from SummaryOutput on purpose - this call needs a short
    name/title pair, not a full elaborated summary."""

    name: str = Field(description="Short classroom name, max 6 words")
    course_title: str = Field(description="One-line descriptive course title")


class ClassroomMatchState(TypedDict, total=False):
    conn: object  # psycopg connection, injected at invoke time
    student_id: int
    title: str
    description: Optional[str]
    summary: str
    embedding: list[float]
    request_id: int
    matches: list[dict]
    best_score: float
    decision: str
    result: dict


def summarize_node(state: ClassroomMatchState) -> dict:
    structured_llm = llm.with_structured_output(SummaryOutput)
    result = structured_llm.invoke(
        [
            SystemMessage(content=SUMMARY_SYSTEM_PROMPT),
            HumanMessage(
                content=f"Title: {state['title']}\nDescription: {state.get('description') or ''}"
            ),
        ]
    )
    # NOTE: adjust `.summary` if your SummaryOutput schema uses a different field name
    return {"summary": result.summary}


def embed_node(state: ClassroomMatchState) -> dict:
    vector = embeddings.embed_query(state["summary"])
    return {"embedding": vector}


def store_request_node(state: ClassroomMatchState) -> dict:
    request_id = store.create_request(
        state["conn"],
        requested_by=state["student_id"],
        title=state["title"],
        description=state.get("description"),
        summary=state["summary"],
        embedding=state["embedding"],
    )
    return {"request_id": request_id}


def similarity_search_node(state: ClassroomMatchState) -> dict:
    matches = store.find_similar_classrooms(
        state["conn"], embedding=state["embedding"], limit=5
    )
    best_score = matches[0]["similarity"] if matches else 0.0
    return {"matches": matches, "best_score": best_score}


def route_on_similarity(state: ClassroomMatchState) -> str:
    return "match" if state["best_score"] >= SIMILARITY_THRESHOLD else "no_match"


def suggest_classrooms_node(state: ClassroomMatchState) -> dict:
    good_matches = [
        {**m, "newly_created": False}
        for m in state["matches"]
        if m["similarity"] >= SIMILARITY_THRESHOLD
    ]
    return {
        "decision": "match",
        "result": {"suggested_classrooms": good_matches},
    }


def create_classroom_node(state: ClassroomMatchState) -> dict:
    structured_llm = llm.with_structured_output(ClassroomTopicOutput)
    topic = structured_llm.invoke(
        [
            SystemMessage(
                content="Give a short classroom name and one-line course title for the broad topic below."
            ),
            HumanMessage(content=state["summary"]),
        ]
    )
    classroom_id = store.create_classroom(
        state["conn"],
        name=topic.name,
        course_title=topic.course_title,
        description=state["summary"],
        embedding=state["embedding"],
    )
    
    new_classroom = {
        "id": classroom_id,
        "name": topic.name,
        "course_title": topic.course_title,
        "description": state["summary"],
        "similarity": 1.0,
        "newly_created": True,
    }
    return {
        "decision": "no_match",
        "result": {"suggested_classrooms": [new_classroom]},
    }


def build_graph():
    graph = StateGraph(ClassroomMatchState)
    graph.add_node("summarize", summarize_node)
    graph.add_node("embed", embed_node)
    graph.add_node("store_request", store_request_node)
    graph.add_node("similarity_search", similarity_search_node)
    graph.add_node("suggest_classrooms", suggest_classrooms_node)
    graph.add_node("create_classroom", create_classroom_node)

    graph.add_edge(START, "summarize")
    graph.add_edge("summarize", "embed")
    graph.add_edge("embed", "store_request")
    graph.add_edge("store_request", "similarity_search")
    graph.add_conditional_edges(
        "similarity_search",
        route_on_similarity,
        {"match": "suggest_classrooms", "no_match": "create_classroom"},
    )
    graph.add_edge("suggest_classrooms", END)
    graph.add_edge("create_classroom", END)

    return graph.compile()


classroom_match = build_graph()

