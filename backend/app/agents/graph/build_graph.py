"""
Main agent graph.

        START
          |
   [role_router]              <- conditional edge straight off START
     /          \\
student_route  teacher_route    <- each is an LLM call that decides next_route
     \\          /
      \\        /
   [student_router]  [teacher_router]   <- conditional edges reading next_route
    |    |    |    |    |
    v    v    v    v    v
  rag  chat  quiz tools planner   <- all shared by both roles
  node  node  node node   node
    |    |    |    |    |
   END  END  END  END  END

- rag_node      -> app/subgraphs/rag_subgraph.py       (vector+keyword+rerank RAG)
- quiz_node     -> app/subgraphs/quiz_subgraph.py       (RAG-grounded generation, validate/retry, persist)
- tools_node    -> app/subgraphs/calendar_tools_subgraph.py (ReAct tool-calling loop)
- planner_node  -> app/subgraphs/planner_subgraph.py    (learning-workflow generation, validate/retry)
- chat_node     -> plain LLM call, no subgraph needed
"""

from langgraph.graph import StateGraph, START, END

from app.state import AgentState
from app.graph.nodes import (
    role_router,
    student_route_node,
    student_router,
    teacher_route_node,
    teacher_router,
    rag_node,
    chat_node,
    quiz_node,
    tools_node,
    planner_node,
)

ROUTE_TARGETS = {
    "rag_node": "rag_node",
    "chat_node": "chat_node",
    "quiz_node": "quiz_node",
    "tools_node": "tools_node",
    "planner_node": "planner_node",
}


def build_agent_graph():
    graph = StateGraph(AgentState)

    graph.add_node("student_route", student_route_node)
    graph.add_node("teacher_route", teacher_route_node)
    graph.add_node("rag_node", rag_node)
    graph.add_node("chat_node", chat_node)
    graph.add_node("quiz_node", quiz_node)
    graph.add_node("tools_node", tools_node)
    graph.add_node("planner_node", planner_node)

    graph.add_conditional_edges(
        START,
        role_router,
        {"student_route": "student_route", "teacher_route": "teacher_route"},
    )

    # both student and teacher routers land on the SAME shared sub-nodes
    graph.add_conditional_edges("student_route", student_router, ROUTE_TARGETS)
    graph.add_conditional_edges("teacher_route", teacher_router, ROUTE_TARGETS)

    graph.add_edge("rag_node", END)
    graph.add_edge("chat_node", END)
    graph.add_edge("quiz_node", END)
    graph.add_edge("tools_node", END)
    graph.add_edge("planner_node", END)

    return graph.compile()


agent_graph = build_agent_graph()
