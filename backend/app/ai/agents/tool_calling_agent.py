import json
from datetime import datetime, timezone
from typing import Optional, List, Literal

from pydantic import BaseModel
from loguru import logger

from app.ai.memory.agent_short_term_memories import get_short_term_memory
# NOTE: adjust this import path to wherever text_to_text / GeminiServiceError
# actually live in your codebase.
from app.ai.utils.llm import text_to_text,GeminiServiceError

GEMINI_MODEL = "gemini-2.5-flash"
MAX_TOOL_LOOPS = 5  # safety cap against infinite reasoning loops


# ---------------------------------------------------------------------------
# DB-backed calendar functions (unchanged)
# ---------------------------------------------------------------------------

_COLUMNS = [
    "id", "classroom_id", "event_date", "event_type", "reference_id",
    "created_by", "is_personal", "title", "description",
    "created_at", "updated_at",
]

EVENT_TYPES = ["TASK"]  # keep in sync with the `calendar_event_type` Postgres enum


def _row_to_dict(row) -> dict:
    d = dict(zip(_COLUMNS, row))
    for key in ("event_date", "created_at", "updated_at"):
        if isinstance(d.get(key), datetime):
            d[key] = d[key].isoformat()
    return d


def fetch_all_my_events(conn, user_id: int, classroom_id: int) -> dict:
    """Fetch classroom-wide events plus this user's personal events in it."""
    curr = conn.cursor()
    try:
        curr.execute(
            f"""
            SELECT {", ".join(_COLUMNS)}
            FROM calendar_events
            WHERE classroom_id = %s AND is_personal = FALSE AND event_date >= NOW()
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

        logger.debug(
            f"fetch_all_my_events: classroom_rows={len(classroom_rows)}, personal_rows={len(personal_rows)}"
        )

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
        logger.exception(f"fetch_all_my_events failed, rolled back. Error: {e}")
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
    """Insert a personal event. Always classroom_id=NULL, is_personal=TRUE."""
    if event_type not in EVENT_TYPES:
        return {
            "success": False,
            "message": f"Invalid event_type '{event_type}'. Must be one of {EVENT_TYPES}.",
            "data": None,
        }

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
        return {
            "success": True,
            "message": f"Event created successfully at {now.isoformat()}",
            "data": {"id": new_id},
        }

    except Exception as e:
        conn.rollback()
        logger.exception(f"insert_event failed, rolled back. Error: {e}")
        return {"success": False, "message": f"Failed to create event: {e}", "data": None}

    finally:
        curr.close()


# ---------------------------------------------------------------------------
# Structured-output schema
#
# Instead of Gemini's native function-calling (automatic function_call /
# function_response parts), the model is forced, on every turn, to emit a
# single JSON object matching AgentDecision. We get this via the existing
# text_to_text helper's output_format param (response_schema under the
# hood), then dispatch to the real DB functions server-side ourselves.
# text_to_text already owns empty-response checks, JSON validation, and
# API-error handling — the loop below just calls it and reacts to the
# parsed decision.
# ---------------------------------------------------------------------------

class AddEventArgs(BaseModel):
    title: str
    description: str 
    event_date: str  # ISO-8601, WITH timezone offset, resolved by the model
    event_type: Literal["TASK"]


class AgentDecision(BaseModel):
    thought: str  # brief internal reasoning — never shown to the user
    action: Literal["get_all_my_events", "add_event", "respond"]
    add_event_args: Optional[AddEventArgs]
    response_text: Optional[str]


def _build_system_prompt(user_id: int, classroom_id: int, memory_block: str) -> str:
    """Rebuilt fresh per invocation so the model is grounded in the real
    current date/time, the actual classroom/user in scope, and recent
    conversation context."""
    now = datetime.now(timezone.utc)
    today = now.date()
    day_name = now.strftime("%A")
    month_name = now.strftime("%B")
    logger.debug(
        f"Building system prompt for user_id={user_id}, classroom_id={classroom_id}, "
        f"now={now.isoformat()}, day_name={day_name}, month_name={month_name}"
    )

    memory_section = ""
    if memory_block:
        memory_section = (
            "\nRecent conversation history (oldest first, for context only):\n"
            f"{memory_block}\n"
        )

    return f"""You are a helpful classroom assistant embedded in a chat.

Current date and time (UTC): {now.isoformat()}
Current date (YYYY-MM-DD): {today.isoformat()}
Current day of the week: {day_name}
Current month: {month_name}
Current classroom_id: {classroom_id}
Current user_id: {user_id}
{memory_section}
You do not call tools directly. Instead, on every turn you must respond with a
single JSON object matching this schema:
  - thought: a short private reasoning note (not shown to the user)
  - action: exactly one of "get_all_my_events", "add_event", "respond"
  - add_event_args: required only when action is "add_event"
  - response_text: required only when action is "respond" — this is the
    final, natural-language answer shown to the user

Available actions:
- "get_all_my_events": request the shared classroom events plus the user's own
  personal events in it. No arguments needed. Choose this whenever the user
  asks about their calendar, due dates, or upcoming events — never answer
  from memory or invent events/dates.
- "add_event": request creation of a personal reminder/to-do for the user.
  This always creates a *personal* event — classroom_id is always NULL and
  is_personal is always TRUE. It can never create or modify the shared
  classroom calendar. If the user explicitly asks to add something to the
  shared classroom calendar, use "respond" to explain you can only add it as
  a personal event, and offer to do that instead.
- "respond": you are done reasoning/acting and are giving the final answer.

When creating an event, resolve any relative date or time (e.g. "tomorrow",
"next Friday at 6pm") against the current date/time,date name if user  say next friday use immediately available next friday above and pass a full
ISO-8601 datetime WITH a timezone offset in add_event_args.event_date — never
guess or invent a date. If the date/time is ambiguous or missing, use
"respond" to ask the user to clarify instead of calling "add_event".


After you receive an Observation for a prior action, use "respond" to
summarize the result for the user in plain, natural language — never repeat
raw JSON or field names verbatim.

Respond with ONLY the JSON object. No preamble, no markdown code fences."""


# ---------------------------------------------------------------------------
# Agent loop (manual ReAct: reason -> act -> observe -> repeat)
# ---------------------------------------------------------------------------

def run_calendar_agent(
    conn,
    user_id: int,
    classroom_id: int,
    session_id: str,
    user_query: str,
    api_key: Optional[str] = None,
) -> str:
    """
    Runs a Gemini structured-output agent for calendar queries/actions,
    grounded in recent short-term memory for the session.

    Returns the final natural-language answer to show the user. Never
    raises — all failure paths degrade to a friendly message, matching the
    error-handling style used elsewhere in the Gemini integration.
    """
    try:
        memory_block = get_short_term_memory(conn, session_id)
        if memory_block == "No previous message found":
            memory_block = ""
    except Exception as e:
        logger.exception(f"Failed to load short-term memory for session {session_id}: {e}")
        memory_block = ""

    system_prompt = _build_system_prompt(user_id, classroom_id, memory_block)

    def _dispatch(action: str, args: Optional[AddEventArgs]) -> dict:
        if action == "get_all_my_events":
            return fetch_all_my_events(conn, user_id=user_id, classroom_id=classroom_id)
        if action == "add_event":
            if args is None:
                return {
                    "success": False,
                    "message": "add_event was requested without arguments.",
                    "data": None,
                }
            return insert_event(
                conn,
                classroom_id=None,
                user_id=user_id,
                title=args.title,
                description=args.description,
                event_date=args.event_date,
                event_type=args.event_type,
            )
        return {"success": False, "message": f"Unknown action: {action}", "data": None}

    # Plain-text transcript instead of native Content/function_call parts —
    # each loop appends what the model decided and what we observed.
    transcript = f"User request: {user_query}\n"

    for loop_count in range(MAX_TOOL_LOOPS):
        try:
            decision = text_to_text(
                input_text=transcript,
                system_prompt=system_prompt,
                api_key=api_key,
                model=GEMINI_MODEL,
                output_format=AgentDecision,
            )
        except GeminiServiceError as e:
            logger.error(f"text_to_text failed in calendar agent (loop {loop_count}): {e.message}")
            return e.message

        if decision is None:
            logger.error(f"text_to_text returned no decision in calendar agent (loop {loop_count}).")
            return "Sorry, I couldn't process that request. Please try again."

        logger.debug(f"calendar_agent loop={loop_count} decision={decision.model_dump()}")

        if decision.action == "respond":
            return decision.response_text or "Sorry, I couldn't process that request."

        if decision.action == "add_event" and decision.add_event_args is None:
            # Model asked to add an event but forgot the args — nudge it
            # via the transcript rather than crashing the loop.
            transcript += (
                f"\nAssistant thought: {decision.thought}\n"
                "Action taken: add_event\n"
                "Observation: add_event requires add_event_args (title, description, "
                "event_date, event_type). Ask the user to clarify what's missing, then "
                "respond.\n"
            )
            continue

        result = _dispatch(decision.action, decision.add_event_args)

        transcript += (
            f"\nAssistant thought: {decision.thought}\n"
            f"Action taken: {decision.action}\n"
            f"Observation: {json.dumps(result, default=str)}\n"
        )

    logger.warning(f"calendar_agent hit MAX_TOOL_LOOPS ({MAX_TOOL_LOOPS}) for session {session_id}")
    return "Sorry, that request is taking too long to process. Please try rephrasing it."