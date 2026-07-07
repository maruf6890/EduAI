
from __future__ import annotations

import json
from typing import Dict, List

from langchain_core.messages import HumanMessage, AIMessage

from app.agents.state import AgentState
from app.agents.llm import llm, student_router_llm, teacher_router_llm, quiz_extraction_llm
from loguru import logger

# ---------------------------------------------------------------------------
# Role routing (student vs teacher) — routes straight off START
# ---------------------------------------------------------------------------
def role_router(state: AgentState) -> str:
    return "student_route" if state["role"] == "student" else "teacher_route"


# ---------------------------------------------------------------------------
# Student routing
# ---------------------------------------------------------------------------
STUDENT_ROUTER_PROMPT = """
You are a student assistant router.

Decide where the request should go.

Routes:

rag_node
- questions about course materials, notes, assignments, lectures,
  uploaded documents if anything that is possibly in the course materials, books info and notes info then it must go to rag_node
  

chat_node:
- only for  casual conversation dont select this route for knowledge questions



quiz_node:
- generate quiz / practice questions / evaluate answers

tools_node:
- calendar lookups ("what's due this week?")
- creating a personal reminder/task
- calculator or other external actions

planner_node:
- "help me learn X" / "make me a study plan for X" / roadmap requests

User message:
{question}
""".strip()


def student_route_node(state: AgentState) -> AgentState:
    prompt = STUDENT_ROUTER_PROMPT.format(question=state["question"])
    decision = student_router_llm.invoke(prompt)
    return {"next_route": decision.next}


def student_router(state: AgentState) -> str:
    return state["next_route"]


# ---------------------------------------------------------------------------
# Teacher routing
# ---------------------------------------------------------------------------
TEACHER_ROUTER_PROMPT = """
You are a STRICT routing system for a teacher assistant.

You must choose EXACTLY ONE route.

Routes:

rag_node:
- ANY question related to course content
- uploaded documents, notes, syllabus, lectures
- academic explanations using classroom knowledge
- questions like "explain", "what is", "how does X work in this course"

chat_node:
- ONLY casual conversation (greetings, small talk)
- general non-academic chat not related to teaching or course content

quiz_node:
- CREATE quizzes, exams, assignments for students
- IMPORTANT: this is for teacher-generated quizzes that will be saved/shared
- includes MCQ, short questions, assessments

tools_node:
- classroom management actions:
  - scheduling classes
  - calendar/events
  - reminders/tasks
  - administrative actions

planner_node:
- designing course structure
- syllabus planning
- roadmap/learning path creation for a subject or semester

RULES:
- If the message is academic or educational → ALWAYS choose rag_node
- If unsure between chat and rag → choose rag_node
- chat_node is ONLY for casual conversation

User message:
{question}
""".strip()


def teacher_route_node(state: AgentState) -> AgentState:
    prompt = TEACHER_ROUTER_PROMPT.format(question=state["question"])
    decision = teacher_router_llm.invoke(prompt)
    return {"next_route": decision.next}


def teacher_router(state: AgentState) -> str:
    return state["next_route"]


# ---------------------------------------------------------------------------
# chat_node — plain conversational answer, no retrieval
# ---------------------------------------------------------------------------
def chat_node(state: AgentState) -> AgentState:
    prompt = f"""You are an AI assistant for an educational platform.
Answer the user's question clearly and concisely.

User Question:
{state['question']}"""

    response = llm.invoke(prompt)

    return {
        "route_used": "chat",
        "messages": [HumanMessage(content=state["question"]), AIMessage(content=response.content)],
        "answer": response.content,
    }


# ---------------------------------------------------------------------------
# rag_node — delegates to the full RAG subgraph (vector + keyword +
# merge + heuristic rerank + context build + answer)
# ---------------------------------------------------------------------------
def rag_node(state: AgentState) -> AgentState:
    from app.agents.subgraphs.rag_subgraph import rag_subgraph_app
    logger.info(f"rag_node subgraph result: rag_subgraph_app")
    sub_result = rag_subgraph_app.invoke({
        "user_id": state.get("user_id"),
        "question": state["question"],
        "classroom_id": state.get("classroom_id"),
        "conn": state["conn"],
    })
    

    answer = sub_result.get("answer", "")
    documents = [c["content"] for c in sub_result.get("reranked_results", [])]


    return {
        "route_used": "rag",
        "documents": documents,
        "context": sub_result.get("context", ""),
        "answer": answer,
        "messages": [HumanMessage(content=state["question"]), AIMessage(content=answer)],
    }


# ---------------------------------------------------------------------------
# quiz_node — extracts quiz-creation params from the chat message, then
# delegates to the full quiz subgraph (RAG-grounded generation, schema +
# invariant validation, retry loop, and persistence via
# create_quiz_by_agent).
# ---------------------------------------------------------------------------
def quiz_node(state: AgentState) -> AgentState:
    from app.agents.subgraphs.quiz_subgraph import quiz_subgraph_app

    extraction = quiz_extraction_llm.invoke(
        "Extract quiz creation details from this request. If specific "
        "details (title, description, number of questions, duration, "
        "schedule date) aren't given, fill in sensible defaults — "
        "num_questions=5, duration_minutes=30, is_published=false, and a "
        "scheduled_at a few days from now.\n\n"
        f"Request: {state['question']}"
    )

    sub_result = quiz_subgraph_app.invoke({
        "classroom_id": state.get("classroom_id"),
        "created_by": int(state.get("user_id") or 0),
        "title": extraction.title,
        "description": extraction.description,
        "scheduled_at": extraction.scheduled_at,
        "duration_minutes": extraction.duration_minutes,
        "is_published": extraction.is_published,
        "topic_scope": extraction.topic_scope,
        "num_questions": extraction.num_questions,
        "conn": state["conn"],
        "max_attempts": 3,
        "attempts": 0,
        "validation_errors": [],
    })

    if sub_result.get("saved"):
        answer = (
            f"Created quiz \"{extraction.title}\" with "
            f"{len(sub_result['questions'])} questions, scheduled for "
            f"{extraction.scheduled_at}."
        )
        tool_result = json.dumps(sub_result["questions"])
    else:
        answer = f"I couldn't create the quiz: {sub_result.get('failure_reason')}"
        tool_result = None

    return {
        "route_used": "quiz",
        "answer": answer,
        "tool_result": tool_result,
        "messages": [HumanMessage(content=state["question"]), AIMessage(content=answer)],
    }


# ---------------------------------------------------------------------------
# tools_node — delegates to the calendar/task ReAct tool-calling subgraph
# ---------------------------------------------------------------------------
def tools_node(state: AgentState) -> AgentState:
    from app.agents.subgraphs.calendar_tools_subgraph import build_calendar_task_agent
    if not state.get("user_id"):
        return {
            "route_used": "tools",
            "answer": "Error: user_id is required for tools_node.",
            "messages": [HumanMessage(content=state["question"]), AIMessage(content="Error: user_id is required.")],
        }
    if not state.get("classroom_id"):
        return {
            "route_used": "tools",
            "answer": "Error: classroom_id is required for tools_node.",
            "messages": [HumanMessage(content=state["question"]), AIMessage(content="Error: classroom_id is required.")],
        }
    print(f"tools_node: user_id={state.get('user_id')}, classroom_id={state.get('classroom_id')}")
    tool_agent = build_calendar_task_agent(
        conn=state["conn"],
        user_id=int(state.get("user_id") or 0),
        classroom_id=state.get("classroom_id") or 0,
    )

    result = tool_agent.invoke({"messages": [HumanMessage(content=state["question"])]})
    answer = result["ans"]

    return {
        "route_used": "tools",
        "answer": answer,
        "messages": [HumanMessage(content=state["question"]), AIMessage(content=answer)],
    }


# ---------------------------------------------------------------------------
# planner_node — delegates to the workflow-planning subgraph
# ---------------------------------------------------------------------------
def planner_node(state: AgentState) -> AgentState:
    from app.agents.subgraphs.planner_subgraph import planner_subgraph_app

    result = planner_subgraph_app.invoke({
        "topic": state["question"],
        "max_attempts": 2,
        "attempts": 0,
        "validation_errors": [],
    })

    if result.get("final_plan"):
        plan = result["final_plan"]
        answer = f"Here's a learning plan for \"{plan['title']}\" ({len(plan['flow']['nodes'])} steps)."
        tool_result = json.dumps(plan)
    else:
        answer = f"I couldn't build a plan: {result.get('failure_reason')}"
        tool_result = None

    return {
        "route_used": "planner",
        "answer": answer,
        "tool_result": tool_result,
        "messages": [HumanMessage(content=state["question"]), AIMessage(content=answer)],
    }
