from fastapi import APIRouter, Depends, HTTPException
import json

from app.agents.db import get_db
from app.agents import chat_store
from app.schemas.chat_schema import CreateSessionRequest, ChatRequest, ChatResponse
from app.agents.graph.build_graph import agent_graph

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/sessions")
def create_session(payload: CreateSessionRequest, conn=Depends(get_db)):
    session = chat_store.create_session(
        conn,
        user_id=payload.user_id,
        classroom_id=payload.classroom_id,
        title=payload.title,
    )
    return {"success": True, "message": "Session created", "data": session}


@router.get("/sessions/{user_id}")
def list_sessions(user_id: int, conn=Depends(get_db)):
    sessions = chat_store.list_sessions(conn, user_id=user_id)
    return {"success": True, "message": "Sessions fetched", "data": sessions}


@router.get("/sessions/detail/{session_id}/messages")
def get_messages(session_id: int, conn=Depends(get_db)):
    session = chat_store.get_session(conn, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = chat_store.list_messages(conn, session_id)
    return {"success": True, "message": "Messages fetched", "data": messages}


@router.post("/sessions/{session_id}/message")
def send_message(session_id: int, payload: ChatRequest, conn=Depends(get_db)):
    session = chat_store.get_session(conn, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # reload prior turns so the graph has conversational context
    history = chat_store.load_messages(conn, session_id)

    initial_state = {
        "messages": history,
        "role": payload.role,
        "question": payload.question,
        "user_id": str(payload.user_id),
        "session_id": str(session_id),
        "classroom_id": payload.classroom_id or session.get("classroom_id"),
        "documents": [],
        "conn": conn,
    }

    result = agent_graph.invoke(initial_state)
    answer = result.get("answer") or ""

    # persist both turns
    chat_store.save_message(conn, session_id, "human", {"content": payload.question}, tool_result=None)
    chat_store.save_message(conn, session_id, "ai", {"content": answer}, tool_result=result.get("tool_result"))

    json_result = None
    if result.get("tool_result"):
            json_result = json.loads(result["tool_result"])
    
    return {
        "session_id": session_id,
        "answer": answer,
        "tool_result": json_result
    }
