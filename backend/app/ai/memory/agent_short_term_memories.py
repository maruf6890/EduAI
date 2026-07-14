from loguru import logger


def get_short_term_memory(conn, session_id: str, limit: int = 5) -> str:
    """
    Fetch the last `limit` chat messages for a session, formatted as
    "role: message" lines, oldest first. Returns a fallback string if
    no messages exist or on failure.
    """
    cursor = None
    try:
        cursor = conn.cursor()

        query = """
            SELECT message_type, message, tool_result
            FROM chat_messages
            WHERE session_id = %s
            ORDER BY created_at DESC
            LIMIT %s;
        """

        cursor.execute(query, (session_id, limit))
        rows = cursor.fetchall()

        if not rows:
            return "No previous message found"

        memory = []

        for message_type, message, tool_result in rows:
            # Convert message to string
            if isinstance(message, dict):
                message_text = message.get("text", str(message))
            else:
                message_text = str(message)

            # Include tool output if this turn was a tool call
            if message_type == "tool" and tool_result:
                tool_text = (
                    tool_result.get("text", str(tool_result))
                    if isinstance(tool_result, dict)
                    else str(tool_result)
                )
                message_text = f"{message_text} [tool_result: {tool_text}]"

            memory.append(f"{message_type}: {message_text}")

        # Reverse so oldest message comes first
        memory.reverse()

        return "\n".join(memory)

    except Exception as e:
        logger.exception(f"Error getting memory for session_id={session_id}: {e}")
        return "No previous message found"

    finally:
        if cursor is not None:
            cursor.close()