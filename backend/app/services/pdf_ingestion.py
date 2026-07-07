from __future__ import annotations

import asyncio
import io
import json
import logging
import os
from typing import Optional

from psycopg2.extras import execute_values
from pypdf import PdfReader
from langchain_google_genai import GoogleGenerativeAIEmbeddings

logger = logging.getLogger(__name__)

# ── Config ─────────────────────────────────────────────────────────────────
# Replace this with however the rest of your app loads config
# (e.g. `from app.core.config import settings; settings.GOOGLE_API_KEY`)
GOOGLE_API_KEY = os.environ["GOOGLE_API_KEY"]

EMBEDDING_MODEL = "gemini-embedding-2-preview"
EMBEDDING_DIM = 3072                # must match classroom_embeddings.embedding vector(768)
CHUNK_SIZE = 1200                   # characters per chunk
CHUNK_OVERLAP = 150                 # characters of overlap between consecutive chunks
MAX_EMBED_CONCURRENCY = 5           # concurrent embedding calls

# task_type="RETRIEVAL_DOCUMENT" biases embeddings for storage/retrieval use.
# A separate instance with task_type="RETRIEVAL_QUERY" should be used when
# embedding the user's search query at query time (see embed_query_text below).
_embeddings_doc = GoogleGenerativeAIEmbeddings(
    model=EMBEDDING_MODEL,
    output_dimensionality=EMBEDDING_DIM,
    api_key=GOOGLE_API_KEY,
    task_type="RETRIEVAL_DOCUMENT",
)

_embeddings_query = GoogleGenerativeAIEmbeddings(
    model=EMBEDDING_MODEL,
    output_dimensionality=EMBEDDING_DIM,
    api_key=GOOGLE_API_KEY,
    task_type="RETRIEVAL_QUERY",
)


# ── Extraction ───────────────────────────────────────────────────────────────

def extract_pdf_pages(file_bytes: bytes) -> list[tuple[int, str]]:
    """Returns [(page_number, page_text), ...], 1-indexed. Skips empty pages
    (e.g. pages that are pure images with no embedded text layer)."""
    reader = PdfReader(io.BytesIO(file_bytes))
    pages: list[tuple[int, str]] = []
    for i, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        if text:
            pages.append((i, text))
    return pages


# ── Chunking ─────────────────────────────────────────────────────────────────

def chunk_page_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Sliding-window character chunking with overlap, kept within one page
    so each chunk can be tagged with an accurate page number."""
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    text_len = len(text)
    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunks.append(text[start:end])
        if end == text_len:
            break
        start = end - overlap
    return chunks


def build_chunks(pages: list[tuple[int, str]]) -> list[dict]:
    """Returns [{"page": int, "chunk_number": int, "content": str}, ...],
    chunk_number is a global 0-indexed sequence across the whole document."""
    chunks = []
    chunk_number = 0
    for page_number, page_text in pages:
        for piece in chunk_page_text(page_text):
            chunks.append({
                "page": page_number,
                "chunk_number": chunk_number,
                "content": piece,
            })
            chunk_number += 1
    return chunks


# ── Embedding ────────────────────────────────────────────────────────────────

async def _embed_one(content: str, semaphore: asyncio.Semaphore) -> list[float]:
    """
    Embeds a single chunk in isolation. This is deliberately NOT batched:
    gemini-embedding-2-preview aggregates multiple inputs passed in a single
    embed_content()/embed_documents() call into one combined vector rather
    than returning one vector per input, so batching here would silently
    corrupt chunk-level embeddings.
    """
    async with semaphore:
        vec = await asyncio.to_thread(_embeddings_doc.embed_query, content)
        if len(vec) != EMBEDDING_DIM:
            raise RuntimeError(
                f"Embedding returned {len(vec)} dims, expected {EMBEDDING_DIM}. "
                "output_dimensionality may not be taking effect for this model/version."
            )
        return vec


async def embed_all_chunks(chunks: list[dict]) -> list[list[float]]:
    semaphore = asyncio.Semaphore(MAX_EMBED_CONCURRENCY)
    tasks = [_embed_one(c["content"], semaphore) for c in chunks]
    return await asyncio.gather(*tasks)


async def embed_query_text(query: str) -> list[float]:
    """Use this at search time (separate task_type from document embedding)."""
    vec = await asyncio.to_thread(_embeddings_query.embed_query, query)
    if len(vec) != EMBEDDING_DIM:
        raise RuntimeError(f"Query embedding returned {len(vec)} dims, expected {EMBEDDING_DIM}.")
    return vec


# ── Storage ──────────────────────────────────────────────────────────────────

def _vector_literal(vec: list[float]) -> str:
    """Format a python float list as a pgvector text literal, e.g. '[0.1,0.2,...]'."""
    return "[" + ",".join(repr(float(v)) for v in vec) + "]"


def store_document_and_embeddings(
    conn,
    classroom_id: int,
    material_id: int,
    chunks: list[dict],
    vectors: list[list[float]],
) -> int:
    """Inserts one classroom_documents row, then bulk-inserts every chunk's
    embedding into classroom_embeddings. Returns the new document id."""
    if len(chunks) != len(vectors):
        raise ValueError(f"chunk/vector count mismatch: {len(chunks)} vs {len(vectors)}")

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO classroom_documents (classroom_id, material_id)
            VALUES (%s, %s)
            RETURNING id
            """,
            (classroom_id, material_id),
        )
        document_id = cur.fetchone()["id"]

        rows = [
            (
                document_id,
                chunk["chunk_number"],
                chunk["content"],
                _vector_literal(vector),
                json.dumps({
                    "page": chunk["page"],
                    "model": EMBEDDING_MODEL,
                    "dims": EMBEDDING_DIM,
                }),
            )
            for chunk, vector in zip(chunks, vectors)
        ]

        execute_values(
            cur,
            """
            INSERT INTO classroom_embeddings (document_id, chunk_number, content, embedding, metadata)
            VALUES %s
            """,
            rows,
            template="(%s, %s, %s, %s::vector, %s::jsonb)",
        )

    return document_id


# ── Orchestration ────────────────────────────────────────────────────────────

async def ingest_pdf_material(
    conn,
    classroom_id: int,
    material_id: int,
    file_bytes: bytes,
) -> Optional[int]:
    """
    Full pipeline: extract -> chunk -> embed -> store.
    Returns the classroom_documents.id on success, or None if the PDF had no
    extractable text (e.g. a scanned/image-only PDF with no text layer — you'd
    need OCR for that case, which this pipeline doesn't do).
    Raises on embedding/DB failures so the caller decides whether that should
    fail the whole upload or just be logged.
    """
    pages = extract_pdf_pages(file_bytes)
    if not pages:
        logger.warning(
            "No extractable text in material_id=%s — possibly a scanned/image-only PDF",
            material_id,
        )
        return None

    chunks = build_chunks(pages)
    vectors = await embed_all_chunks(chunks)
    document_id = store_document_and_embeddings(conn, classroom_id, material_id, chunks, vectors)

    logger.info(
        "Ingested material_id=%s -> document_id=%s (%d chunks, %d pages)",
        material_id, document_id, len(chunks), len(pages),
    )
    return document_id
