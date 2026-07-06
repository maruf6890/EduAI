from typing import TypedDict, List, Optional, Annotated, Literal, Any
from operator import add
from langchain_core.messages import BaseMessage


class AgentState(TypedDict, total=False):
    # conversation history — the `add` reducer means every node should
    # return ONLY the new messages it produced, never the full list,
    # or you'll end up with duplicated history (LangGraph concatenates
    # whatever a node returns onto what's already there).
    messages: Annotated[List[BaseMessage], add]

    role: Literal["student", "teacher"]

    # current user query
    question: str

    # routing decisions
    next_action: Optional[str]
    next_route: Optional[str]

    # RAG data
    documents: List[str]
    context: Optional[str]

    # tool outputs
    tool_result: Optional[str]

    # final response
    answer: Optional[str]
    route_used: Optional[str]
    result_reference: Optional[List[str]]
    # metadata
    user_id: Optional[str]
    session_id: Optional[str]
    classroom_id: Optional[int]

    # per-request DB connection, injected by the API layer before invoking
    # the graph. Not persisted, not part of the "real" conversation state —
    # just piggybacking on AgentState so nodes can reach the DB without
    # global module-level connections.
    conn: Any
