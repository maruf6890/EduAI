
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Annotated, TypedDict, List, Optional

from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_core.tools import tool
from langchain_core.messages import BaseMessage, SystemMessage
from app.agents.llm import llm


_COLUMNS = [
    "id", "classroom_id", "event_date", "event_type", "reference_id",
    "created_by", "is_personal", "title", "description",
    "created_at", "updated_at",
]

# Keep this in sync with the `calendar_event_type` Postgres enum.
EVENT_TYPES = ["TASK"]


def _row_to_dict(row) -> dict:
    d = dict(zip(_COLUMNS, row))
    for key in ("event_date", "created_at", "updated_at"):
        if isinstance(d.get(key), datetime):
            d[key] = d[key].isoformat()
    return d


def fetch_all_my_events(conn, user_id: int, classroom_id: int) -> dict:
    """Fetch all classroom-wide events for `classroom_id`, plus the current
    user's own personal events within that classroom."""
    curr = conn.cursor()
    try:
        curr.execute(
            f"""
            SELECT {", ".join(_COLUMNS)}
            FROM calendar_events
            WHERE classroom_id = %s AND is_personal = FALSE AND  event_date >= NOW()
            ORDER BY event_date;
            """,
            (classroom_id,),
        )
        classroom_rows = curr.fetchall()

        curr.execute(
            f"""
            SELECT {", ".join(_COLUMNS)}
            FROM calendar_events
            WHERE classroom_id = %s AND is_personal = TRUE AND created_by = %s AND event_date >= NOW()
            ORDER BY event_date;
            """,
            (classroom_id, user_id),
        )
        personal_rows = curr.fetchall()
        print(f"fetch_all_my_events: classroom_rows={len(classroom_rows)}, personal_rows={len(personal_rows)}")

        return {
            "success": True,
            "message": "Events fetched successfully",
            "data": {
                "classroom_events": [_row_to_dict(r) for r in classroom_rows],
                "personal_events": [_row_to_dict(r) for r in personal_rows],
            },
        }

    except Exception as e:
        conn.rollback()
        print(f"fetch_all_my_events failed, rolled back. Error: {e}")
        return {"success": False, "message": f"Failed to fetch events: {e}", "data": None}

    finally:
        curr.close()


def insert_event(
    conn,
    classroom_id: Optional[int],
    user_id: int,
    title: str,
    description: Optional[str],
    event_date: str,
    event_type: str = "TASK",
    reference_id: Optional[int] = None,
) -> dict:
    """Insert a personal event. Always created with classroom_id = NULL and
    is_personal = TRUE — this never attaches an event to a classroom."""
    curr = conn.cursor()
    try:
        now = datetime.now(timezone.utc)
        curr.execute(
            """
            INSERT INTO calendar_events (
                classroom_id, event_date, event_type, reference_id,
                created_by, is_personal, title, description,
                created_at, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, TRUE, %s, %s, %s, %s)
            RETURNING id;
            """,
            (classroom_id, event_date, event_type, reference_id, user_id, title, description, now, now),
        )
        new_id = curr.fetchone()[0]
        conn.commit()
        return {"success": True, "message": f"Event created successfully at {now.isoformat()}", "data": {"id": new_id}}

    except Exception as e:
        conn.rollback()
        print(f"insert_event failed, rolled back. Error: {e}")
        return {"success": False, "message": f"Failed to create event: {e}", "data": None}

    finally:
        curr.close()


# ---------------------------------------------------------------------------
# Tool factory — binds conn / user_id / classroom_id from session context
# ---------------------------------------------------------------------------
def build_tools(conn, user_id: int, classroom_id: int):

    @tool
    def get_all_my_events() -> str:
        """Fetch every event for the current classroom: the classroom's
        shared events (assignments, quizzes, meetings, etc.) plus this
        user's own personal events in it. Takes no arguments — the
        classroom and user are already known from context. Always call
        this when the user asks what's on their calendar, what's due,
        what's coming up, or anything about existing events — never guess
        dates or event details from memory."""
        result = fetch_all_my_events(conn, user_id=user_id, classroom_id=classroom_id)
        return json.dumps(result)

    @tool
    def add_event(
        title: str,
        description: str,
        event_date: str,
        event_type: str = "TASK",
    ) -> str:
        """Create a new personal event/reminder for the current user.

        Args:
            title: Short name of the event.
            description: Longer detail about the event. Pass an empty
                string if the user gave none.
            event_date: ISO-8601 datetime WITH timezone offset, e.g.
                "2026-07-10T18:00:00Z" or "2026-07-10T18:00:00+06:00".
                Resolve any relative date/time the user gives (e.g.
                "tomorrow at 6pm", "next Friday") against the current
                date and timezone given in the system prompt — never
                guess a date.
            event_type: One of TASK (must match the calendar_event_type enum exactly).
                Defaults to "TASK" for a generic personal reminder/to-do.

        This tool ALWAYS creates a personal event: classroom_id is always
        NULL and is_personal is always TRUE. It can never create or modify
        a classroom-wide event — if the user asks to add something to the
        shared classroom calendar, say you can only add it as a personal
        event instead."""
        result = insert_event(
            conn, user_id=user_id, classroom_id=classroom_id, title=title, description=description,
            event_date=event_date, event_type=event_type,
        )
        return json.dumps(result)

    return [get_all_my_events, add_event]


# ---------------------------------------------------------------------------
# Sub-state and graph
# ---------------------------------------------------------------------------
class ToolAgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    ans: str


def build_system_prompt(user_id: int, classroom_id: int) -> str:
    """Built fresh per invocation so the model is always grounded in the
    real current date/time and the actual classroom/user it's bound to.
    A static prompt string can't resolve relative dates like 'tomorrow'
    and doesn't tell the model which classroom is already in scope."""
    now = datetime.now(timezone.utc)
    return (
        "You are a helpful classroom assistant embedded in a chat.\n\n"
        f"Current date and time (UTC): {now.isoformat()}\n"
        f"Current classroom_id: {classroom_id}\n"
        f"Current user_id: {user_id}\n\n"
        "You have two tools:\n"
        "- get_all_my_events: fetch this classroom's shared events plus "
        "the user's own personal events in it. Call this whenever the "
        "user asks about what's on their calendar, due dates, or "
        "upcoming events — never answer from memory or guess dates.\n"
        "- add_event: create a personal reminder/to-do for the user. "
        "This always creates a *personal* event, never a classroom "
        "event — if the user explicitly asks to add something to the "
        "classroom's shared calendar, explain that you can only add "
        "personal events and offer to add it as one instead.\n\n"
        "When creating an event, resolve any relative date or time "
        "(e.g. 'tomorrow', 'next Friday at 6pm') against the current "
        "date/time above and pass a full ISO-8601 datetime with a "
        "timezone offset — never guess or invent a date. If the "
        "date/time is ambiguous or missing, ask the user to clarify "
        "before calling add_event.\n\n"
        "After any tool call returns, summarize the result for the user "
        "in plain, natural language — never repeat raw JSON or field "
        "names verbatim."
    )


def route_debug(state):
    result = tools_condition(state)
    print("ROUTER RESULT:", result)
    return result

def build_calendar_task_agent(conn, user_id: int, classroom_id: int):
    tools = build_tools(conn, user_id=user_id, classroom_id=classroom_id)
    llm_with_tools = llm.bind_tools(tools)

    def agent_node(state: ToolAgentState) -> ToolAgentState:
        messages = state["messages"]
        system_prompt = build_system_prompt(user_id=user_id, classroom_id=classroom_id)
        if messages and isinstance(messages[0], SystemMessage):
            messages = [SystemMessage(content=system_prompt)] + messages[1:]
        else:
            messages = [SystemMessage(content=system_prompt)] + messages
        response = llm_with_tools.invoke(messages)
        print(f"calendar_task_agent: response.answer={response}")
        return {"messages": [response], "ans": response.text}

    graph = StateGraph(ToolAgentState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", ToolNode(tools))

    graph.add_edge(START, "agent")
    graph.add_conditional_edges(
        "agent", route_debug, {"tools": "tools", "__end__": END}
    )
    graph.add_edge("tools", "agent")

    return graph.compile()