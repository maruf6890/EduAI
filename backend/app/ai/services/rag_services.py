import os
import uuid
from datetime import datetime, timezone
from typing import List, Literal, Optional
from fastapi import UploadFile
from app.ai.utils.llm import text_to_text
from loguru import logger
from pydantic import BaseModel
from pypdf import PdfReader

from langchain_core.documents import Document
from langchain_classic.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever
from langchain_chroma import Chroma
from langchain_community.tools import WikipediaQueryRun
from langchain_google_genai import GoogleGenerativeAIEmbeddings  # or swap for your embedding of choice
from langchain_community.utilities import WikipediaAPIWrapper


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

CHROMA_PERSIST_DIR = os.environ.get("CHROMA_PERSIST_DIR", "./chroma_db")
COLLECTION_NAME = "documents"
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 150

DocType = Literal["personal", "central"]

_embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")

vectorstore = Chroma(
    collection_name=COLLECTION_NAME,
    persist_directory=CHROMA_PERSIST_DIR
)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class RagAnswer(BaseModel):
    answer: str
    used_web_fallback: bool
    sources: List[str] = []


# ---------------------------------------------------------------------------
# 1. Extract + chunk PDF into LangChain Documents
# ---------------------------------------------------------------------------

def _chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    if not text:
        return []

    chunks = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = min(start + chunk_size, text_len)
        piece = text[start:end].strip()
        if piece:
            chunks.append(piece)
        if end == text_len:
            break
        start = end - overlap

    return chunks


def extract_docs_with_chunking(
    pdf_file: UploadFile,
    title: str,
    description: str,
    classroom_id: str,
    doc_type: DocType,
    created_by: str,
) -> List[Document]:
    """
    Extract text from a PDF and split into overlapping chunks, returned as
    LangChain Document objects with metadata for access-controlled retrieval.
    """
    try:
        reader = PdfReader(pdf_file)
    except Exception as e:
        logger.exception(f"Failed to open PDF {pdf_file}: {e}")
        raise

    doc_id = str(uuid.uuid4())
    uploaded_at = datetime.now(timezone.utc).isoformat()

    documents: List[Document] = []

    for page_number, page in enumerate(reader.pages, start=1):
        page_text = page.extract_text() or ""
        if not page_text.strip():
            continue

        for piece in _chunk_text(page_text):
            metadata = {
                "doc_id": doc_id,
                "title": title,
                "description": description,
                "classroom_id": classroom_id,
                "type": doc_type,
                "created_by": created_by,
                "page_number": page_number,
                "uploaded_at": uploaded_at,
            }
            documents.append(Document(page_content=piece, metadata=metadata))

    if not documents:
        logger.warning(f"No extractable text found in {pdf_file}")

    return documents


# ---------------------------------------------------------------------------
# 2. Store in Chroma (via LangChain vectorstore)
# ---------------------------------------------------------------------------

def store_in_vector_db(documents: List[Document]) -> int:
    if not documents:
        logger.warning("store_in_vector_db called with no documents — nothing to store.")
        return 0

    try:
        ids = [f"{doc.metadata['doc_id']}_{doc.metadata['page_number']}_{uuid.uuid4().hex[:8]}" for doc in documents]
        vectorstore.add_documents(documents=documents, ids=ids)
        logger.info(f"Stored {len(documents)} chunks in Chroma.")
        return len(documents)
    except Exception as e:
        logger.exception(f"Failed to store documents in Chroma: {e}")
        raise


# ---------------------------------------------------------------------------
# 3. Ensemble (hybrid BM25 + vector) retrieval with access control
# ---------------------------------------------------------------------------
# NOTE: BM25Retriever has no metadata filter support — it just ranks whatever
# document list it's built from. So for access control we first pull the
# candidate set from Chroma using a metadata `where` filter, build a BM25
# index on just that subset, and run the vector retriever with the SAME
# filter — then ensemble the two over that access-scoped candidate pool.

def _access_filter(classroom_id: str, user_id: str) -> dict:
    """Chroma metadata filter: central docs in this classroom, OR personal
    docs in this classroom created by this user."""
    return {
        "$or": [
            {
                "$and": [
                    {"classroom_id": {"$eq": classroom_id}},
                    {"type": {"$eq": "central"}},
                ]
            },
            {
                "$and": [
                    {"classroom_id": {"$eq": classroom_id}},
                    {"type": {"$eq": "private"}},
                    {"created_by": {"$eq": user_id}},
                ]
            },
        ]
    }


def ensambled_retribal(
    query: str,
    classroom_id: str,
    user_id: str,
    k: int = 5,
) -> List[Document]:
    """
    Hybrid retrieval (BM25 + vector similarity) restricted to documents the
    user is allowed to see: central docs in their classroom, or their own
    personal docs in that classroom.
    """
    where_filter = _access_filter(classroom_id, user_id)

    try:
        # Vector retriever, scoped via Chroma's native metadata filter
        vector_retriever = vectorstore.as_retriever(
            search_kwargs={"k": k, "filter": where_filter}
        )

        # Pull the same access-scoped candidate pool for BM25 (keyword search)
        raw = vectorstore.get(where=where_filter, include=["documents", "metadatas"])
        candidate_docs = [
            Document(page_content=doc_text, metadata=meta)
            for doc_text, meta in zip(raw.get("documents", []), raw.get("metadatas", []))
        ]

        if not candidate_docs:
            logger.info(f"No accessible documents for classroom={classroom_id}, user={user_id}")
            return []

        bm25_retriever = BM25Retriever.from_documents(candidate_docs)
        bm25_retriever.k = k

        hybrid = EnsembleRetriever(
            retrievers=[bm25_retriever, vector_retriever],
            weights=[0.4, 0.6],
        )

        return hybrid.invoke(query)

    except Exception as e:
        logger.exception(f"Retrieval failed for classroom={classroom_id}, user={user_id}: {e}")
        return []




_wikipedia_tool = WikipediaQueryRun(api_wrapper=WikipediaAPIWrapper(top_k_results=1, doc_content_chars_max=2000))




def wikipedia_search_tool(query: str) -> Optional[str]:
    try:
        result = _wikipedia_tool.invoke(query)
        return result if result and result.strip() else None
    except Exception as e:
        logger.exception(f"Wikipedia search failed for query '{query}': {e}")
        return None



RAG_SYSTEM_PROMPT = """
You are an educational assistant answering a student's or teacher's question using the provided context.

Use ONLY the given context to answer. If the context is insufficient or irrelevant, clearly say so
rather than making up an answer. Be concise and accurate.
""".strip()


def llm_query_for_rag_pipeline(
    query: str,
    classroom_id: str,
    user_id: str,
) -> RagAnswer:
    """
    1. Hybrid-retrieve access-scoped classroom document chunks.
    2. If nothing useful found, fall back to DuckDuckGo, then Wikipedia.
    3. Feed context into the LLM to produce a grounded answer.
    """
    docs = ensambled_retribal(query=query, classroom_id=classroom_id, user_id=user_id)

    context_parts: List[str] = []
    sources: List[str] = []
    used_web_fallback = False

    if docs:
        for d in docs:
            title = d.metadata.get("title", "Unknown document")
            context_parts.append(f"[{title}] {d.page_content}")
            sources.append(title)
    else:
        used_web_fallback = True
        web_result =  wikipedia_search_tool(query)

        if web_result:
            context_parts.append(f"[wikipedia] {web_result}")
            sources.append("wikipedia")
       

    if not context_parts:
        return RagAnswer(
            answer="I couldn't find any relevant information to answer this question.",
            used_web_fallback=used_web_fallback,
            sources=[],
        )

    context_text = "\n\n".join(context_parts)

    answer_text = text_to_text(
        input_text=f"Question: {query}\n\nContext:\n{context_text}",
        system_prompt=RAG_SYSTEM_PROMPT,
    )

    return RagAnswer(
        answer=answer_text or "I couldn't generate an answer from the available context.",
        used_web_fallback=used_web_fallback,
        sources=sources,
    )