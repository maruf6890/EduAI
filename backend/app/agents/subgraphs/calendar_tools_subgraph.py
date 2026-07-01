"""
Calendar / personal-task tool-calling subgraph. Ported from the standalone
calendar_task_agent.py, using the shared app.llm instance.

Invoked from app/graph/nodes.py::tools_node as:

    app = build_calendar_task_agent(conn=state["conn"], user_id=..., classroom_id=...)
    result = app.invoke({"messages": [HumanMessage(content=state["question"])]})
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Annotated, TypedDict, List

from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_core.tools import tool
from langchain_core.messages import BaseMessage, SystemMessage

from app.llm import llm


# ---------------------------------------------------------------------------
# get_classroom_calendar / create_personal_task_by_agent — real DB logic
# ---------------------------------------------------------------------------
def get_classroom_calendar(conn, classroom_id: int, user_id: int) -> dict:
    """Expects an `events` table:
    events(id, classroom_id, title, description, event_date, event_type,
           reference_id, created_by, is_personal, created_at, updated_at)
    """
    curr = conn.cursor()
    try:
        curr.execute(
            """
            SELECT id, classroom_id, title, description, event_date,
                   event_type, reference_id, created_by, is_personal,
                   created_at, updated_at
            FROM events
            WHERE classroom_id = %s AND is_personal = FALSE
            ORDER BY event_date;
            """,
            (classroom_id,),
        )
        classroom_rows = curr.fetchall()

        curr.execute(
            """
            SELECT id, classroom_id, title, description, event_date,
                   event_type, reference_id, created_by, is_personal,
                   created_at, updated_at
            FROM events
            WHERE classroom_id = %s AND is_personal = TRUE AND created_by = %s
            ORDER BY event_date;
            """,
            (classroom_id, user_id),
        )
        personal_rows = curr.fetchall()

        columns = [
            "id", "classroom_id", "title", "description", "event_date",
            "event_type", "reference_id", "created_by", "is_personal",
            "created_at", "updated_at",
        ]

        def row_to_dict(row):
            d = dict(zip(columns, row))
            for key in ("event_date", "created_at", "updated_at"):
                if isinstance(d[key], datetime):
                    d[key] = d[key].isoformat()
            return d

        return {
            "success": True,
            "message": "Calendar fetched successfully",
            "data": {
                "classroom_events": [row_to_dict(r) for r in classroom_rows],
                "personal_tasks": [row_to_dict(r) for r in personal_rows],
            },
        }

    except Exception as e:
        conn.rollback()
        print(f"get_classroom_calendar failed, rolled back. Error: {e}")
        return {"success": False, "message": f"Failed to fetch calendar: {e}", "data": None}

    finally:
        curr.close()


def create_personal_task_by_agent(
    conn,
    user_id: int,
    title: str,
    description,
    event_date,
    classroom_id,
) -> bool:
    curr = conn.cursor()
    try:
        now = datetime.now(timezone.utc)
        curr.execute(
            """
            INSERT INTO events (
                classroom_id, title, description, event_date, event_type,
                reference_id, created_by, is_personal, created_at, updated_at
            )
            VALUES (%s, %s, %s, %s, 'TASK', NULL, %s, TRUE, %s, %s);
            """,
            (classroom_id, title, description, event_date, user_id, now, now),
        )
        conn.commit()
        return True

    except Exception as e:
        conn.rollback()
        print(f"create_personal_task_by_agent failed, rolled back. Error: {e}")
        return False

    finally:
        curr.close()


# ---------------------------------------------------------------------------
# Tool factory — binds conn / user_id / classroom_id from session context
# ---------------------------------------------------------------------------
def build_tools(conn, user_id: int, classroom_id: int):

    @tool
    def check_classroom_calendar() -> str:
        """Fetch the classroom's upcoming events (assignments, quizzes, etc.)
        and the current user's personal tasks for this classroom. Use this
        whenever the user asks what's on their calendar, what's due, what's
        coming up, or similar — do not guess dates from memory."""
        result = get_classroom_calendar(conn, classroom_id=classroom_id, user_id=user_id)
        return json.dumps(result)

    @tool
    def create_personal_task(title: str, description: str, event_date: str) -> str:
        """Create a personal task/reminder for the current user in this
        classroom. `event_date` must be an ISO-8601 datetime string
        (e.g. "2026-07-10T18:00:00Z"). Use this when the user asks to be
        reminded of something, or to add a personal to-do/task."""
        saved = create_personal_task_by_agent(
            conn, user_id=user_id, title=title, description=description,
            event_date=event_date, classroom_id=classroom_id,
        )
        return json.dumps({
            "success": saved,
            "message": "Task created successfully" if saved else "Failed to create task",
        })

    return [check_classroom_calendar, create_personal_task]


# ---------------------------------------------------------------------------
# Sub-state and graph
# ---------------------------------------------------------------------------
class ToolAgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]


SYSTEM_PROMPT = (
    "You are a helpful classroom assistant. You can check the classroom "
    "calendar or create personal tasks/reminders for the user via the "
    "tools available to you. Always use a tool rather than guessing dates "
    "or event details. After a tool call returns, summarize the result "
    "for the user in plain language — don't just repeat raw JSON."
)


def build_calendar_task_agent(conn, user_id: int, classroom_id: int):
    tools = build_tools(conn, user_id=user_id, classroom_id=classroom_id)
    llm_with_tools = llm.bind_tools(tools)

    def agent_node(state: ToolAgentState) -> ToolAgentState:
        messages = state["messages"]
        if not any(isinstance(m, SystemMessage) for m in messages):
            messages = [SystemMessage(content=SYSTEM_PROMPT)] + messages
        response = llm_with_tools.invoke(messages)
        return {"messages": [response]}

    graph = StateGraph(ToolAgentState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", ToolNode(tools))

    graph.add_edge(START, "agent")
    graph.add_conditional_edges(
        "agent", tools_condition, {"tools": "tools", "__end__": END}
    )
    graph.add_edge("tools", "agent")

    return graph.compile()
