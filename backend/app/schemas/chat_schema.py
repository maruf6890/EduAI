
from pydantic import BaseModel, Field
from typing import Literal, Optional


# --- routing decisions (structured LLM output) --------------------------
class StudentRouteDecision(BaseModel):
    next: Literal["rag_node", "chat_node", "quiz_node", "tools_node", "planner_node"]


class TeacherRouteDecision(BaseModel):
    next: Literal["rag_node", "chat_node", "quiz_node", "tools_node", "planner_node"]


# --- quiz creation parameter extraction (chat -> structured request) ----
class QuizExtraction(BaseModel):
    title: str
    description: str
    topic_scope: str
    num_questions: int = 5
    duration_minutes: int = 30
    is_published: bool = False
    scheduled_at: str  # ISO-8601 datetime string; propose a reasonable
                        # future date/time if the user didn't specify one


# --- FastAPI request/response bodies -------------------------------------
class CreateSessionRequest(BaseModel):
    user_id: int
    classroom_id: Optional[int] = None
    title: Optional[str] = None


class ChatRequest(BaseModel):
    question: str
    role: Literal["student", "teacher"]
    user_id: int
    classroom_id: Optional[int] = None


class ChatResponse(BaseModel):
    session_id: int
    answer: str
    tool_result: Optional[str] = None


class CalendarEventLLMOutput(BaseModel):
    answer:str=Field (..., description="The natural language response to the user")


