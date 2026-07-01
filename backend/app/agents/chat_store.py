import json
from typing import List, Optional, Dict, Any

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage


# ---------------------------------------------------------------------------
# chat_sessions
# ---------------------------------------------------------------------------
def create_session(conn, user_id: int, classroom_id: Optional[int], title: Optional[str]) -> dict:
    curr = conn.cursor()
    try:
        curr.execute(
            """
            INSERT INTO chat_sessions (user_id, classroom_id, title)
            VALUES (%s, %s, %s)
            RETURNING id, user_id, classroom_id, title, created_at, updated_at;
            """,
            (user_id, classroom_id, title),
        )
        row = curr.fetchone()
        conn.commit()
        return _session_row_to_dict(row)
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        curr.close()


def get_session(conn, session_id: int) -> Optional[dict]:
    curr = conn.cursor()
    try:
        curr.execute(
            """
            SELECT id, user_id, classroom_id, title, created_at, updated_at
            FROM chat_sessions
            WHERE id = %s;
            """,
            (session_id,),
        )
        row = curr.fetchone()
        return _session_row_to_dict(row) if row else None
    finally:
        curr.close()


def list_sessions(conn, user_id: int) -> List[dict]:
    curr = conn.cursor()
    try:
        curr.execute(
            """
            SELECT id, user_id, classroom_id, title, created_at, updated_at
            FROM chat_sessions
            WHERE user_id = %s
            ORDER BY updated_at DESC;
            """,
            (user_id,),
        )
        rows = curr.fetchall()
        return [_session_row_to_dict(r) for r in rows]
    finally:
        curr.close()


def touch_session(conn, session_id: int) -> None:
    curr = conn.cursor()
    try:
        curr.execute(
            "UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = %s;",
            (session_id,),
        )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        curr.close()


def _session_row_to_dict(row) -> dict:
    return {
        "id": row[0],
        "user_id": row[1],
        "classroom_id": row[2],
        "title": row[3],
        "created_at": row[4].isoformat() if row[4] else None,
        "updated_at": row[5].isoformat() if row[5] else None,
    }


# ---------------------------------------------------------------------------
# chat_messages
# ---------------------------------------------------------------------------
def save_message(conn, session_id: int, message_type: str, message: Dict[str, Any]) -> dict:
    """message_type is one of 'human' | 'ai' | 'system'. `message` is a
    plain dict stored as JSONB, e.g. {"content": "..."}."""
    curr = conn.cursor()
    try:
        curr.execute(
            """
            INSERT INTO chat_messages (session_id, message_type, message)
            VALUES (%s, %s, %s)
            RETURNING id, session_id, message_type, message, created_at;
            """,
            (session_id, message_type, json.dumps(message)),
        )
        row = curr.fetchone()
        conn.commit()
        touch_session(conn, session_id)
        return {
            "id": row[0],
            "session_id": row[1],
            "message_type": row[2],
            "message": row[3],
            "created_at": row[4].isoformat(),
        }
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        curr.close()


def list_messages(conn, session_id: int) -> List[dict]:
    curr = conn.cursor()
    try:
        curr.execute(
            """
            SELECT id, message_type, message, created_at
            FROM chat_messages
            WHERE session_id = %s
            ORDER BY created_at ASC;
            """,
            (session_id,),
        )
        rows = curr.fetchall()
        return [
            {"id": r[0], "message_type": r[1], "message": r[2], "created_at": r[3].isoformat()}
            for r in rows
        ]
    finally:
        curr.close()


_TYPE_TO_CLASS = {"human": HumanMessage, "ai": AIMessage, "system": SystemMessage}


def load_messages(conn, session_id: int) -> List[BaseMessage]:
    """Reconstruct LangChain BaseMessage objects from stored history, so
    they can be fed back into the graph's `messages` state on each turn."""
    curr = conn.cursor()
    try:
        curr.execute(
            """
            SELECT message_type, message
            FROM chat_messages
            WHERE session_id = %s
            ORDER BY created_at ASC;
            """,
            (session_id,),
        )
        rows = curr.fetchall()
        result: List[BaseMessage] = []
        for message_type, message in rows:
            cls = _TYPE_TO_CLASS.get(message_type, HumanMessage)
            content = message.get("content", "") if isinstance(message, dict) else str(message)
            result.append(cls(content=content))
        return result
    finally:
        curr.close()
