from __future__ import annotations
from datetime import datetime, UTC
from typing import List, Dict, Any, Optional, Literal, Tuple

from loguru import logger
from pydantic import BaseModel, ValidationError, field_validator

from app.ai.utils.llm import text_to_text, GeminiServiceError
from app.ai.services.rag_services import ensambled_retribal


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class QuizQuestionModel(BaseModel):
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: Literal["A", "B", "C", "D"]
    marks: int
    order_index: int

    @field_validator("question_text", "option_a", "option_b", "option_c", "option_d")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("must not be blank")
        return v

    @field_validator("marks")
    @classmethod
    def positive_marks(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("marks must be a positive integer")
        return v


class QuizQuestionsPayload(BaseModel):
    """The full LLM output: a fitting title/description plus the questions,
    all generated together in one call so the title and description are
    actually grounded in the same context (and the same question set) they
    describe, rather than drifting from a separately-generated summary."""
    title: str
    description: str
    questions: List[QuizQuestionModel]

    @field_validator("title", "description")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("must not be blank")
        return v


class QuizGenerationResult(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    questions: Optional[List[Dict[str, Any]]] = None
    quiz_id: Optional[int] = None
    saved: bool = False
    attempts: int = 0
    failure_reason: Optional[str] = None


# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------

QUIZ_SYSTEM_PROMPT = """
You are a quiz-generation assistant for an educational platform.

Given source context and a requested number of questions, generate:
  - title: a short, specific quiz title (max ~8 words) that reflects the
    actual topics covered, not a generic label like "Quiz" or "Test".
  - description: 1-2 sentences summarizing what the quiz covers, written for
    a student about to take it.
  - questions: the multiple-choice questions themselves.

All three must be strictly grounded in the provided context — do not invent
facts, topics, or a title/description that isn't supported by it.

Rules:
- Base every question strictly on the provided context. Do not invent facts
  that aren't supported by it.
- Exactly one correct_option per question, one of "A", "B", "C", "D".
- All four options must be distinct and plausible (no trivially wrong options).
- order_index must start at 1 and increase by 1 with no gaps or duplicates.
- Generate exactly the requested number of questions — no more, no fewer.
- marks must be a positive integer for every question.
- title and description must not be blank, and must reflect the context
  actually retrieved, not just the raw topic_scope string.

Always return your answer strictly following the provided schema.
""".strip()


# ---------------------------------------------------------------------------
# Context retrieval — reuses the RAG service's hybrid retriever
# ---------------------------------------------------------------------------

def _build_quiz_context(
    classroom_id: str,
    user_id: str,
    topic_scope: str,
) -> str:
    """
    Retrieve access-scoped context for quiz generation using the same
    hybrid BM25 + vector retriever as the RAG pipeline.
    """
    query = topic_scope
    docs = ensambled_retribal(query=query, classroom_id=classroom_id, user_id=user_id, k=10)

    if not docs:
        logger.warning(f"No context found for quiz generation: classroom_id={classroom_id}, query={query}")
        return ""

    # Dedupe on content in case BM25 and vector both surface the same chunk
    seen = set()
    pieces = []
    for d in docs:
        if d.page_content in seen:
            continue
        seen.add(d.page_content)
        pieces.append(d.page_content)

    return "\n\n---\n\n".join(pieces)


# ---------------------------------------------------------------------------
# Semantic validation (beyond what Pydantic schema validation already covers)
# ---------------------------------------------------------------------------

def _validate_questions(payload: QuizQuestionsPayload, expected_count: int) -> List[str]:
    errors: List[str] = []
    questions = payload.questions

    if len(questions) != expected_count:
        errors.append(f"Expected {expected_count} questions, got {len(questions)}.")

    order_indexes = sorted(q.order_index for q in questions)
    if order_indexes != list(range(1, len(questions) + 1)):
        errors.append("order_index values must be unique, start at 1, and have no gaps.")

    for i, q in enumerate(questions, start=1):
        options = {q.option_a, q.option_b, q.option_c, q.option_d}
        if len(options) < 4:
            errors.append(f"Question {i}: all four options must be distinct.")

    return errors


# ---------------------------------------------------------------------------
# Generation loop (reason -> validate -> retry-or-finalize)
# ---------------------------------------------------------------------------

def _generate_questions(
    topic_scope: str,
    context: str,
    num_questions: int,
    max_attempts: int = 3,
) -> Tuple[Optional[QuizQuestionsPayload], List[str], int]:
    """Returns (payload_or_None, validation_errors, attempts_used).

    payload, when present, carries the LLM-generated title and description
    alongside the questions — none of these are supplied by the caller.
    """
    validation_errors: List[str] = []
    attempts = 0

    while attempts < max_attempts:
        attempts += 1

        prompt_parts = [
            f"Generate a quiz title, description, and {num_questions} "
            f"multiple-choice questions covering: {topic_scope}.",
            f"Context (source material to base the quiz on):\n{context}",
        ]

        if validation_errors:
            errors_block = "\n".join(f"- {e}" for e in validation_errors)
            prompt_parts.append(
                "Your previous attempt was invalid for these reasons:\n"
                f"{errors_block}\n"
                "Fix these issues in your next attempt."
            )

        input_text = "\n\n".join(prompt_parts)

        try:
            payload: Optional[QuizQuestionsPayload] = text_to_text(
                input_text=input_text,
                system_prompt=QUIZ_SYSTEM_PROMPT,
                output_format=QuizQuestionsPayload,
            )
        except GeminiServiceError as e:
            logger.error(f"LLM call failed on attempt {attempts} for topic '{topic_scope}': {e.message}")
            validation_errors = [f"LLM call failed: {e.message}"]
            continue

        if payload is None:
            validation_errors = ["LLM returned no output."]
            continue

        errors = _validate_questions(payload, expected_count=num_questions)
        if not errors:
            logger.info(
                f"Valid quiz generated for topic '{topic_scope}' after {attempts} attempt(s): "
                f"title='{payload.title}'."
            )
            return payload, [], attempts

        validation_errors = errors
        logger.warning(f"Attempt {attempts} invalid for topic '{topic_scope}': {errors}")

    return None, validation_errors, attempts


# ---------------------------------------------------------------------------
# Persistence
# ---------------------------------------------------------------------------

def create_quiz_by_agent(
    conn,
    classroom_id: int,
    created_by: int,
    title: str,
    description: str,
    scheduled_at,
    duration_minutes: int,
    questions: list,
) -> Tuple[bool, Optional[int]]:
    """Insert a quiz and its questions in a single transaction.

    Returns (success, quiz_id). quiz_id is None on failure.

    is_published is intentionally always True for agent-created quizzes.
    total_marks is computed as the sum of each question's marks.
    """
    curr = conn.cursor()
    try:
        curr.execute(
            """
            INSERT INTO quizzes (
                classroom_id, created_by, title, description,
                scheduled_at, duration_minutes, is_published, created_at, total_marks
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
            """,
            (
                classroom_id, created_by, title, description,
                scheduled_at, duration_minutes, True, datetime.now(UTC),
                sum(q["marks"] for q in questions),
            ),
        )
        quiz_id = curr.fetchone()[0]

        for q in questions:
            curr.execute(
                """
                INSERT INTO quiz_questions (
                    quiz_id, question_text, option_a, option_b, option_c,
                    option_d, correct_option, marks, order_index
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
                """,
                (
                    quiz_id, q["question_text"], q["option_a"], q["option_b"],
                    q["option_c"], q["option_d"], q["correct_option"],
                    q["marks"], q["order_index"],
                ),
            )

        conn.commit()
        return True, quiz_id

    except Exception as e:
        conn.rollback()
        logger.exception(f"create_quiz_by_agent failed, rolled back. Error: {e}")
        return False, None

    finally:
        curr.close()


def generate_and_save_quiz(
    conn,
    classroom_id: int,
    created_by: int,
    topic_scope: str,
    scheduled_at: Optional[str] = None,
    duration_minutes: int = 5,
    num_questions: int = 5,
    max_attempts: int = 3,
) -> QuizGenerationResult:
    """
    Full quiz generation pipeline:
      1. Retrieve access-scoped context via the RAG service's hybrid retriever.
      2. Generate + validate a title, description, and quiz questions with
         Gemini (all grounded in the same retrieved context), retrying on
         failure.
      3. Persist the quiz + questions if generation succeeded.

    title/description are not caller-supplied — they're produced by the LLM
    from the same context used for the questions, so they stay consistent
    with what's actually being tested.
    """
    if scheduled_at is None:
        # Computed here (not as a default arg) so every call gets "now" at
        # call time, not a value frozen once at module import.
        scheduled_at = datetime.now(UTC).isoformat()

    context = _build_quiz_context(
        classroom_id=str(classroom_id),
        user_id=str(created_by),
        topic_scope=topic_scope,
    )

    if not context:
        reason = "No classroom context found to base quiz questions on."
        logger.error(reason)
        return QuizGenerationResult(saved=False, failure_reason=reason)

    payload, errors, attempts = _generate_questions(
        topic_scope=topic_scope,
        context=context,
        num_questions=num_questions,
        max_attempts=max_attempts,
    )

    if payload is None:
        reason = (
            f"Failed to generate a valid quiz after {attempts} attempts. "
            f"Last errors: {'; '.join(errors)}"
        )
        logger.error(reason)
        return QuizGenerationResult(saved=False, attempts=attempts, failure_reason=reason)

    questions = [q.model_dump() for q in payload.questions]

    success, quiz_id = create_quiz_by_agent(
        conn=conn,
        classroom_id=classroom_id,
        created_by=created_by,
        title=payload.title,
        description=payload.description,
        scheduled_at=scheduled_at,
        duration_minutes=duration_minutes,
        questions=questions,
    )

    return QuizGenerationResult(
        title=payload.title,
        description=payload.description,
        questions=questions,
        quiz_id=quiz_id,
        saved=success,
        attempts=attempts,
        failure_reason=None if success else "create_quiz_by_agent failed to insert the quiz",
    )