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

#get session by user id and classroom id
@router.get("/sessions/{user_id}/classrooms/{classroom_id}")
def get_session(user_id: int, classroom_id: int, conn=Depends(get_db)):
    session = chat_store.list_sessions_by_classroom_and_user_id(conn, user_id=user_id, classroom_id=classroom_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"success": True, "message": "Session fetched", "data": session}


@router.get("/sessions/detail/{session_id}/messages")
def get_messages(session_id: int, conn=Depends(get_db)):
    session = chat_store.get_session(conn, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = chat_store.list_messages(conn, session_id)
    return {"success": True, "message": "Messages fetched", "data": messages}


# #list-messages-by-user-and-classroom
# @router.get("/sessions/{user_id}/classrooms/{classroom_id}/messages")
# def list_messages_by_user_and_classroom(user_id: int, classroom_id: int, conn=Depends(get_db)):
#     if not chat_store.get_session(conn, user_id):
#         raise HTTPException(status_code=404, detail="Session not found")
#     if not chat_store.get_session(conn, classroom_id):
#         raise HTTPException(status_code=404, detail="Classroom not found")
#     messages = chat_store.list_messages_by_classroom_and_users(conn, classroom_id=classroom_id, user_ids=[user_id])
#     return {"success": True, "message": "Messages fetched", "data": messages}

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
    chat_store.save_message(conn, session_id, "ai", {"content": answer}, tool_result=result.get("tool_result"), result_reference=result.get("result_reference"), route_used=result.get("route_used"))


    
    return {
        "data": {
        "session_id": session_id,
        "message": {"content": answer},
        "message_type": "ai",
        "tool_result": json.loads(result.get("tool_result")) if result.get("tool_result") else None,
        "route_used": result.get("route_used"),
        "result_reference": result.get("result_reference"),

        },
            "success": True,
            "message": "Message processed successfully"}
