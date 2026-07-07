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
    user_id: str
    conn: Any

    # (embedding_id, chunk_number, content, document_name, distance)
    vector_results: List[Tuple[int, int, str, str, float]]
    # (embedding_id, chunk_number, content, document_name, bm25_score)
    keyword_results: List[Tuple[int, int, str, str, float]]
    merged_results: List[dict]
    reranked_results: List[dict]
    context: str
    answer: str


def retrieval_node(state: RagState) -> RagState:
    conn = state["conn"]
    curr = conn.cursor()
    question = state["question"]
    results: List[Tuple[int, int, str, str, float]] = []
    try:
        query_vector = embeddings.embed_query(question)
        curr.execute(
            """
            SELECT
                e.id AS embedding_id,
                e.chunk_number,
                e.content,
                m.title AS document_name,
                e.embedding <=> %s::vector AS distance
            FROM classroom_embeddings e
            JOIN classroom_documents d ON e.document_id = d.id
            JOIN materials m ON d.material_id = m.id
            WHERE (d.classroom_id = %s AND m.visibility = 'CENTRAL')
            OR (d.classroom_id = %s AND m.visibility = 'PRIVATE' AND m.uploaded_by = %s)
            ORDER BY e.embedding <=> %s::vector
            LIMIT 5;
            """,
            (query_vector, state.get("classroom_id"), state.get("classroom_id"), state.get("user_id"), query_vector),
        )
        results = curr.fetchall()
    except Exception as e:
        conn.rollback()
        logger.error(f"rag_subgraph retrieval failed, rolled back. Error: {e}")
    finally:
        curr.close()

    return {"vector_results": results}


def keyword_search_node(state: RagState) -> RagState:
    conn = state["conn"]
    curr = conn.cursor()
    question = state["question"]
    top: List[Tuple[int, int, str, str, float]] = []
    try:
        curr.execute(
            """
            SELECT
                e.id AS embedding_id,
                e.chunk_number,
                e.content,
                m.title AS document_name
            FROM classroom_embeddings e
            JOIN classroom_documents d ON e.document_id = d.id
            JOIN materials m ON d.material_id = m.id
            WHERE (d.classroom_id = %s AND m.visibility = 'CENTRAL')
            OR (d.classroom_id = %s AND m.visibility = 'PRIVATE' AND m.uploaded_by = %s);
            """,
            (state.get("classroom_id"), state.get("classroom_id"), state.get("user_id")),
        )
        rows = curr.fetchall()
        if rows:
            ids = [r[0] for r in rows]
            chunk_numbers = [r[1] for r in rows]
            docs = [r[2] for r in rows]
            document_names = [r[3] for r in rows]
            bm25 = BM25Okapi([d.split() for d in docs])
            scores = bm25.get_scores(question.split())
            top = sorted(
                zip(ids, chunk_numbers, docs, document_names, scores),
                key=lambda x: x[4],
                reverse=True,
            )[:5]
    except Exception as e:
        conn.rollback()
        logger.error(f"rag_subgraph keyword search failed, rolled back. Error: {e}")
    finally:
        curr.close()

    return {"keyword_results": top}


def merge_node(state: RagState) -> RagState:
    merged: dict = {}

    # Keyed by embedding_id so the same chunk retrieved by both vector
    # search and keyword search merges into a single entry with both
    # scores, instead of producing two disjoint entries.
    for embedding_id, chunk_number, content, doc_name, distance in state.get("vector_results", []):
        merged[embedding_id] = {
            "document_name": doc_name,
            "chunk_number": chunk_number,
            "content": content,
            "vector_distance": distance,
            "bm25_score": None,
        }

    for embedding_id, chunk_number, content, doc_name, score in state.get("keyword_results", []):
        if embedding_id in merged:
            merged[embedding_id]["bm25_score"] = score
        else:
            merged[embedding_id] = {
                "document_name": doc_name,
                "chunk_number": chunk_number,
                "content": content,
                "vector_distance": None,
                "bm25_score": score,
            }
    return {"merged_results": list(merged.values())}


def re_ranking_node(state: RagState) -> RagState:
    candidates = state.get("merged_results", [])

    logger.debug(f"re_ranking_node candidates: {candidates}")

    def score(c: dict) -> float:
        vector_score = -(c["vector_distance"] if c["vector_distance"] is not None else 1.0)
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
    logger.debug(f"ask_llm_node context: {context}")
    logger.debug(f"ask_llm_node reranked results: {reranked_results}")
    prompt = (
        "Answer the question using only the context below. "
        "If the answer isn't in the context, say you don't know. Provide a detailed explanation "
        "based on the context provided, and mention sources.\n\n"
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