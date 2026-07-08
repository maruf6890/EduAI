import json
from typing import List, Optional, Dict, Any

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage


#-------------------------------------------------------------------------
# store vector data in database 
#-------------------------------------------------------------------------


def save_vector_data(conn, session_id: int, vector_data: List[float]) -> None:
    curr = conn.cursor()
    try:
        curr.execute(
            """
            INSERT INTO vector_data (session_id, vector)
            VALUES (%s, %s);
            """,
            (session_id, json.dumps(vector_data)),
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        curr.close()

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

def list_sessions_by_classroom_and_user_id(conn, classroom_id: int, user_id: int) -> List[dict]:
    curr = conn.cursor()
    try:
        curr.execute(
            """
            SELECT id, user_id, classroom_id, title, created_at, updated_at
            FROM chat_sessions
            WHERE classroom_id = %s AND user_id = %s
            ORDER BY updated_at DESC;
            """,
            (classroom_id, user_id),
        )
        rows = curr.fetchall()
        return [_session_row_to_dict(r) for r in rows]
    finally:
        curr.close()


def get_session_by_user_and_classroom(conn, user_id: int, classroom_id: int) -> Optional[dict]:
    curr = conn.cursor()
    try:
        curr.execute(
            """
            SELECT id, user_id, classroom_id, title, created_at, updated_at
            FROM chat_sessions
            WHERE user_id = %s AND classroom_id = %s;
            """,
            (user_id, classroom_id),
        )
        row = curr.fetchone()
        return _session_row_to_dict(row) if row else None
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
def save_message(
    conn,
    session_id: int,
    message_type: str,
    message: Dict[str, Any],
    tool_result: Dict[str, Any] = None,
    result_reference: Dict[str, Any] = None,
    route_used: str = None
) -> dict:

    curr = conn.cursor()

    try:
        curr.execute(
            """
            INSERT INTO chat_messages (
                session_id,
                message_type,
                message,
                tool_result,
                result_reference,
                route_used
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, session_id, message_type, message, tool_result, result_reference, route_used, created_at;
            """,
            (
                session_id,
                message_type,
                json.dumps(message),
                json.dumps(tool_result) if tool_result else None,
                json.dumps(result_reference) if result_reference else None,
                route_used,
            ),
        )

        row = curr.fetchone()
        conn.commit()

        touch_session(conn, session_id)

        return {
            "id": row[0],
            "session_id": row[1],
            "message_type": row[2],
            "message": row[3],
            "tool_result": row[4],
            "result_reference": row[5],
            "route_used": row[6],
            "created_at": row[7].isoformat() if row[7] else None,
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
            SELECT id, message_type, message, tool_result, created_at,result_reference,route_used
            FROM chat_messages
            WHERE session_id = %s
            ORDER BY created_at ASC;
            """,
            (session_id,),
        )
        rows = curr.fetchall()
        return [
            {"id": r[0], "message_type": r[1], "message": r[2], "tool_result": json.loads(r[3]) if r[3] else None, "created_at": r[4].isoformat(), "result_reference": json.loads(r[5]) if r[5] else None, "route_used": r[6]}
            for r in rows
        ]
    finally:
        curr.close()

def list_messages_by_classroom_and_users(conn, classroom_id: int, user_ids: List[int]) -> List[dict]:
    curr = conn.cursor()
    try:
        curr.execute(
            """
            SELECT cm.id, cm.message_type, cm.message, cm.tool_result, cm.created_at,cs.id as session_id, cm.result_reference,cm.route_used
            FROM chat_messages cm
            JOIN chat_sessions cs ON cm.session_id = cs.id
            WHERE cs.classroom_id = %s AND cs.user_id = ANY(%s)
            ORDER BY cm.created_at ASC;
            """,
            (classroom_id, user_ids),
        )
        rows = curr.fetchall()
        return [
            {"id": r[0], "message_type": r[1], "message": r[2], "tool_result": json.loads(r[3]) if r[3] else None, "created_at": r[4].isoformat(), "session_id": r[5], "result_reference": json.loads(r[6]) if r[6] else None, "route_used": r[7]}
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
            SELECT message_type, message, tool_result
            FROM chat_messages
            WHERE session_id = %s
            ORDER BY created_at ASC;
            """,
            (session_id,),
        )
        rows = curr.fetchall()
        result: List[BaseMessage] = []
        for message_type, message, tool_result in rows:
            cls = _TYPE_TO_CLASS.get(message_type, HumanMessage)
            content = message.get("content", "") if isinstance(message, dict) else str(message)
            result.append(cls(content=content))
        return result
    finally:
        curr.close()
