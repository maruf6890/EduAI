"""
RAG subgraph — vector + keyword retrieval, merge, rerank, context build,
answer. Ported from the standalone rag_graph.py, adapted so `conn` and
`classroom_id` come from the sub-state (injected by the caller) instead
of module-level globals, and using the shared app.llm instances.

Invoked from app/graph/nodes.py::rag_node as:

    rag_subgraph_app.invoke({
        "question": ...,
        "classroom_id": ...,
        "conn": ...,
    })
"""

from __future__ import annotations

from typing import TypedDict, List, Tuple, Any

from langgraph.graph import StateGraph, START, END
from rank_bm25 import BM25Okapi

from app.agents.llm import llm, embeddings
from loguru import logger

class RagState(TypedDict, total=False):
    question: str
    classroom_id: int
    conn: Any

    vector_results: List[Tuple[str, int, str, float]]
    keyword_results: List[Tuple[str, int, str, float]]
    merged_results: List[dict]
    reranked_results: List[dict]
    context: str
    answer: str


def retrieval_node(state: RagState) -> RagState:
    conn = state["conn"]
    curr = conn.cursor()
    question = state["question"]
    results: List[Tuple[str, int, str, float]] = []
    try:
        query_vector = embeddings.embed_query(question)
        curr.execute(
            """
            SELECT
                d.document_name,
                e.chunk_number,
                e.content,
                e.embedding <=> %s::vector AS distance
            FROM classroom_embeddings e
            JOIN classroom_documents d ON e.document_id = d.id
            WHERE d.classroom_id = %s
            ORDER BY e.embedding <=> %s::vector
            LIMIT 5;
            """,
            (query_vector, state.get("classroom_id"), query_vector),
        )
        results = curr.fetchall()
    except Exception as e:
        conn.rollback()
        print(f"rag_subgraph retrieval failed, rolled back. Error: {e}")
    finally:
        curr.close()

    return {"vector_results": results}


def keyword_search_node(state: RagState) -> RagState:
    conn = state["conn"]
    curr = conn.cursor()
    question = state["question"]
    top: List[Tuple[str, int, str, float]] = []
    try:
        curr.execute(
            """
            SELECT e.id, e.content,d.document_name
            FROM classroom_embeddings e
            JOIN classroom_documents d ON e.document_id = d.id
            WHERE d.classroom_id = %s;
            """,
            (state.get("classroom_id"),),
        )
        rows = curr.fetchall()
        if rows:
            ids = [r[0] for r in rows]
            docs = [r[1] for r in rows]
            document_names = [r[2] for r in rows]
            bm25 = BM25Okapi([d.split() for d in docs])
            scores = bm25.get_scores(question.split())
            top = sorted(zip(ids, docs, document_names, scores), key=lambda x: x[3], reverse=True)[:5]
    except Exception as e:
        conn.rollback()
        print(f"rag_subgraph keyword search failed, rolled back. Error: {e}")
    finally:
        curr.close()

    return {"keyword_results": top}


def merge_node(state: RagState) -> RagState:
    merged: dict = {}

    # logger.info(f"merge_node vector results: {state['vector_results']}")
    for doc_name, chunk_number, content, distance in state.get("vector_results", []):
        key = f"{doc_name}:{chunk_number}"
        merged[key] = {
            "document_name": doc_name,
            "content": content,
            "vector_distance": distance,
            "bm25_score": None,
        }

    # logger.info(f"merge_node keyword results: {state['keyword_results']}")
    for doc_name, chunk_number, content, score in state.get("keyword_results", []):
        key = f"kw:{chunk_number}"
        if key in merged:
            merged[key]["bm25_score"] = score
        else:
            merged[key] = {
                "document_name": doc_name,
                "content": content,
                "vector_distance": None,
                "bm25_score": score,
            }
    return {"merged_results": list(merged.values())}


def re_ranking_node(state: RagState) -> RagState:
    candidates = state.get("merged_results", [])

    print(f"re_ranking_node candidates: {candidates}")

    def score(c: dict) -> float:
        vector_score = -(c["vector_distance"] or 1.0)
        bm25_score = c["bm25_score"] or 0.0
        return vector_score + bm25_score

    reranked = sorted(candidates, key=score, reverse=True)[:5]
    return {"reranked_results": reranked}


def context_builder_node(state: RagState) -> RagState:
    chunks = state.get("reranked_results", [])
    context = "\n\n---\n\n".join(
        f"[{c.get('document_name') or 'unknown source'}] {c['content']}"
        for c in chunks
    )
    return {"context": context}


def ask_llm_node(state: RagState) -> RagState:
    question = state["question"]
    context = state.get("context", "")
    reranked_results = state.get("reranked_results", [])
    print(f"ask_llm_node context: {context}")
    print(f"ask_llm_node reranked results: {reranked_results}")
    # logger.info(f"ask_llm_node context: {context}")
    # logger.info(f"ask_llm_node reranked results: {reranked_results}")
    prompt = (
        "Answer the questio using only the context below. "
        "If the answer isn't in the context, say you don't know. Provide a detailed explanation based on the context provided. and mention sources.\n\n"
        f"Context:\n{context}\n\nQuestion: {question}"
    )
    response = llm.invoke(prompt)
    return {"answer": response.content}


def build_rag_subgraph():
    graph = StateGraph(RagState)

    graph.add_node("retrieval", retrieval_node)
    graph.add_node("keyword_search", keyword_search_node)
    graph.add_node("merge", merge_node)
    graph.add_node("re_ranking", re_ranking_node)
    graph.add_node("context_builder", context_builder_node)
    graph.add_node("ask_llm", ask_llm_node)

    graph.add_edge(START, "retrieval")
    graph.add_edge(START, "keyword_search")
    graph.add_edge("retrieval", "merge")
    graph.add_edge("keyword_search", "merge")
    graph.add_edge("merge", "re_ranking")
    graph.add_edge("re_ranking", "context_builder")
    graph.add_edge("context_builder", "ask_llm")
    graph.add_edge("ask_llm", END)

    return graph.compile()


rag_subgraph_app = build_rag_subgraph()
