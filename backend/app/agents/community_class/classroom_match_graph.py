
from typing import Optional, TypedDict
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field

from app.agents.llm import embeddings, llm
from app.schemas.chat_schema import SummaryOutput
from app.agents.community_class import classroom_request_store as store

SIMILARITY_THRESHOLD = 0.85

SUMMARY_SYSTEM_PROMPT = """You are helping match a student's question to the right classroom topic.
 
Write a summary (120-180 words) that:
1. States the core concept the student is actually asking about
2. Places it inside its immediate parent topic
3. Places that inside 1-2 broader/foundational topics it belongs to
4. Mentions closely related concepts a classroom on this subject would also cover
 
Do not answer the question. Do not include greetings or meta-commentary.
Only output the summary text."""
 
CLASSROOM_TOPIC_SYSTEM_PROMPT = """You are an expert educational content organizer building classroom listings for a learning platform.
 
Given a student's topic summary, produce a classroom name, course title, and course
description. The description will be converted into a vector embedding, and that
embedding is used to match FUTURE student questions - possibly worded completely
differently - to this same classroom. So the description's job is not to read nicely
to a human first; it's to sit in embedding space close to every reasonable way someone
might ask about this subject, while still reading as a real course description a
teacher would approve.
 
Rules for the classroom name:
- 3-6 words, broad enough to cover a family of related questions, never the literal
  question text.
- Name the domain, not the specific technique (e.g. "Data Structures & Algorithms",
  not "Binary Search Trees").
 
Rules for the course description (this is what gets embedded):
- 80-150 words, dense with terminology - do not pad with filler sentences.
- Cover, in order: (1) the core topic itself, (2) its immediate parent/umbrella
  field, (3) 4-8 concrete subtopics or techniques a course on this would include,
  (4) common tools, libraries, or terms practitioners use, (5) 1-2 adjacent fields
  this connects to.
- Use multiple phrasings of the same concept where natural (e.g. both "neural
  networks" and "deep learning models"), since different students search with
  different vocabulary.
- Write in plain descriptive sentences, not a bullet list or keyword dump - a
  keyword-stuffed description embeds worse than one with natural sentence context.
- Never mention "the student" or reference the original question - write it as a
  standalone course catalog description.
 
Examples:
 
Student topic summary:
"How do pointers work in C?"
 
Classroom Name:
"C Programming Fundamentals and Memory Management"
 
Course Description:
"Covers core C programming from variables and control flow through memory
management, including pointers, pointer arithmetic, arrays, structs, and dynamic
allocation with malloc and free. Explores stack versus heap memory, pass-by-reference
semantics, function pointers, and common bugs like memory leaks, dangling pointers,
and buffer overflows. Builds a foundation for low-level programming, systems
programming, embedded development, and understanding how higher-level languages
manage memory under the hood. Related areas include data structures implemented in C
(linked lists, trees), debugging with tools like Valgrind and GDB, and C++ as a
natural next step."
 
---
 
Student topic summary:
"How does backpropagation calculate gradients?"
 
Classroom Name:
"Deep Learning Fundamentals and Neural Network Training"
 
Course Description:
"Covers the foundations of neural networks and how they learn: artificial neurons,
activation functions, forward propagation, loss functions, and gradient-based
optimization. Explains backpropagation and the chain rule, gradient descent variants
like SGD and Adam, learning rate tuning, and common training issues such as vanishing
gradients, overfitting, and regularization techniques like dropout and batch
normalization. Extends into practical model training with frameworks such as PyTorch
and TensorFlow, convolutional and recurrent architectures, and the broader field of
deep learning and machine learning this builds on."
 
Now generate the classroom name, course title, and course description for the topic
summary below."""
 



class ClassroomTopicOutput(BaseModel):
    """Generate a classroom topic output.based on the summary of the student's question. Create a short classroom name, a one-line course title, and a description of the classroom topic.
    Remember to keep the classroom name short (max 6 words) and the course title concise (one line). 
    The description should be a summary of the classroom student question topic,and its elaborated bored topic, in 120-150 words. The description should be informative and engaging, providing a clear overview of the classroom's content and objectives."""

    name: str = Field(description="Short classroom name, max 6 words")
    course_title: str = Field(description="One-line descriptive course title")
    description: str = Field(description="Summary of the classroom topic, 120-180 words")


class ClassroomMatchState(TypedDict, total=False):
    conn: object  # psycopg connection, injected at invoke time
    student_id: int
    title: str
    description: Optional[str]
    summary: str
    embedding: list[float]
    request_id: int
    matches: list[dict]
    best_score: float
    decision: str
    result: dict


def summarize_node(state: ClassroomMatchState) -> dict:
    structured_llm = llm.with_structured_output(SummaryOutput)
    result = structured_llm.invoke(
        [
            SystemMessage(content=SUMMARY_SYSTEM_PROMPT),
            HumanMessage(
                content=f"Title: {state['title']}\nDescription: {state.get('description') or ''}"
            ),
        ]
    )
    # NOTE: adjust `.summary` if your SummaryOutput schema uses a different field name
    return {"summary": result.summary}


def embed_node(state: ClassroomMatchState) -> dict:
    vector = embeddings.embed_query(state["summary"])
    return {"embedding": vector}


def store_request_node(state: ClassroomMatchState) -> dict:
    request_id = store.create_request(
        state["conn"],
        requested_by=state["student_id"],
        title=state["title"],
        description=state.get("description"),
        summary=state["summary"],
        embedding=state["embedding"],
    )
    return {"request_id": request_id}


def similarity_search_node(state: ClassroomMatchState) -> dict:
    matches = store.find_similar_classrooms(
        state["conn"], embedding=state["embedding"], limit=5
    )
    best_score = matches[0]["similarity"] if matches else 0.0
    return {"matches": matches, "best_score": best_score}


def route_on_similarity(state: ClassroomMatchState) -> str:
    return "match" if state["best_score"] >= SIMILARITY_THRESHOLD else "no_match"


def suggest_classrooms_node(state: ClassroomMatchState) -> dict:
    good_matches = [
        {**m, "newly_created": False}
        for m in state["matches"]
        if m["similarity"] >= SIMILARITY_THRESHOLD
    ]
    return {
        "decision": "match",
        "result": {"suggested_classrooms": good_matches},
    }


def create_classroom_node(state: ClassroomMatchState) -> dict:
    structured_llm = llm.with_structured_output(ClassroomTopicOutput)
    topic = structured_llm.invoke(
        [
            SystemMessage(
                content=SUMMARY_SYSTEM_PROMPT
            ),
            HumanMessage(content=state["summary"]),
        ]
    )
    classroom_id = store.create_classroom(
        state["conn"],
        name=topic.name,
        course_title=topic.course_title,
        description=topic.description,
        embedding=state["embedding"],
    )
    
    new_classroom = {
        "id": classroom_id,
        "name": topic.name,
        "course_title": topic.course_title,
        "description": topic.description,
        "similarity": 1.0,
        "newly_created": True,
    }
    return {
        "decision": "no_match",
        "result": {"suggested_classrooms": [new_classroom]},
    }


def build_graph():
    graph = StateGraph(ClassroomMatchState)
    graph.add_node("summarize", summarize_node)
    graph.add_node("embed", embed_node)
    graph.add_node("store_request", store_request_node)
    graph.add_node("similarity_search", similarity_search_node)
    graph.add_node("suggest_classrooms", suggest_classrooms_node)
    graph.add_node("create_classroom", create_classroom_node)

    graph.add_edge(START, "summarize")
    graph.add_edge("summarize", "embed")
    graph.add_edge("embed", "store_request")
    graph.add_edge("store_request", "similarity_search")
    graph.add_conditional_edges(
        "similarity_search",
        route_on_similarity,
        {"match": "suggest_classrooms", "no_match": "create_classroom"},
    )
    graph.add_edge("suggest_classrooms", END)
    graph.add_edge("create_classroom", END)

    return graph.compile()


classroom_match = build_graph()

