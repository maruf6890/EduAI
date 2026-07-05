from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy import true
from app.services.calendar_service import (
    create_classroom_event,
    update_classroom_event,
    delete_classroom_event,
)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _serialize(row: dict) -> dict:
    row = dict(row)
    for field in ("created_at", "updated_at", "scheduled_at", "started_at", "submitted_at"):
        if row.get(field):
            row[field] = row[field].isoformat()
    return row


def _verify_owner(conn, classroom_id: int, user_id: int):
    with conn.cursor() as cur:
        cur.execute("SELECT owner_id FROM classrooms WHERE id = %s", (classroom_id,))
        classroom = cur.fetchone()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")
    if classroom["owner_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the classroom owner can do this")


def _verify_enrolled(conn, classroom_id: int, student_id: int):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id FROM enrollments WHERE classroom_id = %s AND student_id = %s AND status = 'ACTIVE'",
            (classroom_id, student_id),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not enrolled in this classroom")


def _get_questions_for_teacher(conn, quiz_id: int) -> list:
    """Returns questions with correct answers — for teacher only."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, question_text, option_a, option_b, option_c, option_d,
                   correct_option, marks, order_index
            FROM quiz_questions
            WHERE quiz_id = %s
            ORDER BY order_index ASC
            """,
            (quiz_id,),
        )
        return [dict(r) for r in cur.fetchall()]


def _get_questions_for_student(conn, quiz_id: int) -> list:
    """Returns questions WITHOUT correct answers — for students during quiz."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, question_text, option_a, option_b, option_c, option_d, marks, order_index
            FROM quiz_questions
            WHERE quiz_id = %s
            ORDER BY order_index ASC
            """,
            (quiz_id,),
        )
        return [dict(r) for r in cur.fetchall()]


def _recalculate_total_marks(conn, quiz_id: int) -> int:
    with conn.cursor() as cur:
        cur.execute("SELECT COALESCE(SUM(marks), 0) FROM quiz_questions WHERE quiz_id = %s", (quiz_id,))
        total = cur.fetchone()["coalesce"]
    with conn.cursor() as cur:
        cur.execute("UPDATE quizzes SET total_marks = %s WHERE id = %s", (total, quiz_id))
    return total


# ── Teacher: create quiz + questions ─────────────────────────────────────────

def create_quiz(
    conn,
    classroom_id: int,
    created_by: int,
    title: str,
    description,
    scheduled_at,
    duration_minutes: int,
    is_published: bool,
    questions: list,
) -> dict:
    _verify_owner(conn, classroom_id, created_by)

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO quizzes
                (classroom_id, title, description, scheduled_at, duration_minutes, is_published, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, classroom_id, title, description, scheduled_at, duration_minutes,
                      total_marks, is_published, status, created_by, created_at, updated_at
            """,
            (classroom_id, title, description, scheduled_at, duration_minutes, is_published, created_by),
        )
        quiz = _serialize(dict(cur.fetchone()))

    # Insert questions
    inserted_questions = []
    for q in questions:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO quiz_questions
                    (quiz_id, question_text, option_a, option_b, option_c, option_d,
                     correct_option, marks, order_index)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, question_text, option_a, option_b, option_c, option_d,
                          correct_option, marks, order_index
                """,
                (
                    quiz["id"], q.question_text, q.option_a, q.option_b,
                    q.option_c, q.option_d, q.correct_option, q.marks, q.order_index,
                ),
            )
            inserted_questions.append(dict(cur.fetchone()))

    # Update total marks
    total = _recalculate_total_marks(conn, quiz["id"])
    quiz["total_marks"] = total
    quiz["questions"] = inserted_questions

    # Auto-create calendar event for scheduled quiz
    create_classroom_event(
        conn,
        classroom_id=classroom_id,
        title=f"Quiz: {title}",
        description=description,
        event_date=scheduled_at,
        event_type="QUIZ",
        reference_id=quiz["id"],
        created_by=created_by,
    )

    return {
        "success": True,
        "message": "Quiz created successfully",
        "data": quiz,
    }


# ── Teacher: add questions to existing quiz ───────────────────────────────────

def add_questions(conn, classroom_id: int, quiz_id: int, owner_id: int, questions: list) -> dict:
    _verify_owner(conn, classroom_id, owner_id)

    with conn.cursor() as cur:
        cur.execute("SELECT id, status FROM quizzes WHERE id = %s AND classroom_id = %s", (quiz_id, classroom_id))
        quiz = cur.fetchone()

    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    if quiz["status"] in ("ACTIVE", "ENDED"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot edit an active or ended quiz")

    inserted = []
    for q in questions:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO quiz_questions
                    (quiz_id, question_text, option_a, option_b, option_c, option_d,
                     correct_option, marks, order_index)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, question_text, option_a, option_b, option_c, option_d,
                          correct_option, marks, order_index
                """,
                (
                    quiz_id, q.question_text, q.option_a, q.option_b,
                    q.option_c, q.option_d, q.correct_option, q.marks, q.order_index,
                ),
            )
            inserted.append(dict(cur.fetchone()))

    total = _recalculate_total_marks(conn, quiz_id)

    return {
        "success": True,
        "message": "Questions added successfully",
        "data": {
            "questions": inserted,
            "total_marks": total,
        },
    }


# ── Teacher: delete a question ────────────────────────────────────────────────

def delete_question(conn, classroom_id: int, quiz_id: int, question_id: int, owner_id: int) -> dict:
    _verify_owner(conn, classroom_id, owner_id)

    with conn.cursor() as cur:
        cur.execute("SELECT status FROM quizzes WHERE id = %s AND classroom_id = %s", (quiz_id, classroom_id))
        quiz = cur.fetchone()

    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    if quiz["status"] in ("ACTIVE", "ENDED"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot edit an active or ended quiz")

    with conn.cursor() as cur:
        cur.execute(
            "DELETE FROM quiz_questions WHERE id = %s AND quiz_id = %s RETURNING id",
            (question_id, quiz_id),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    total = _recalculate_total_marks(conn, quiz_id)

    return {
        "success": True,
        "message": "Question deleted successfully",
        "data": {"total_marks": total},
    }


# ── Teacher: update quiz ──────────────────────────────────────────────────────

def update_quiz(conn, classroom_id: int, quiz_id: int, owner_id: int, **fields) -> dict:
    _verify_owner(conn, classroom_id, owner_id)

    with conn.cursor() as cur:
        cur.execute("SELECT status FROM quizzes WHERE id = %s AND classroom_id = %s", (quiz_id, classroom_id))
        quiz = cur.fetchone()

    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    if quiz["status"] in ("ACTIVE", "ENDED"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot edit an active or ended quiz")

    updates = {k: v for k, v in fields.items() if v is not None}
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    set_clause = ", ".join(f"{k} = %s" for k in updates)
    values = list(updates.values()) + [quiz_id, classroom_id]

    with conn.cursor() as cur:
        cur.execute(
            f"""
            UPDATE quizzes SET {set_clause}, updated_at = NOW()
            WHERE id = %s AND classroom_id = %s
            RETURNING id, classroom_id, title, description, scheduled_at, duration_minutes,
                      total_marks, is_published, status, created_by, created_at, updated_at
            """,
            values,
        )
        updated_quiz = _serialize(dict(cur.fetchone()))

    updated_quiz["questions"] = _get_questions_for_teacher(conn, quiz_id)

    # Sync calendar if scheduled_at or title changed
    if "scheduled_at" in updates or "title" in updates:
        update_classroom_event(
            conn,
            reference_id=quiz_id,
            event_type="QUIZ",
            title=f"Quiz: {updated_quiz['title']}",
            event_date=updated_quiz.get("scheduled_at"),
        )

    return {
        "success": True,
        "message": "Quiz updated successfully",
        "data": updated_quiz,
    }


# ── Teacher: start quiz manually ──────────────────────────────────────────────

def start_quiz(conn, classroom_id: int, quiz_id: int, owner_id: int) -> dict:
    _verify_owner(conn, classroom_id, owner_id)

    with conn.cursor() as cur:
        cur.execute("SELECT id, status, is_published FROM quizzes WHERE id = %s AND classroom_id = %s", (quiz_id, classroom_id))
        quiz = cur.fetchone()

    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    if quiz["status"] == "ACTIVE":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quiz is already active")

    if quiz["status"] == "ENDED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quiz has already ended")

    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE quizzes SET status = 'ACTIVE', is_published = TRUE, updated_at = NOW()
            WHERE id = %s
            RETURNING id, classroom_id, title, description, scheduled_at, duration_minutes,
                      total_marks, is_published, status, created_by, created_at, updated_at
            """,
            (quiz_id,),
        )
        updated_quiz = _serialize(dict(cur.fetchone()))

    return {
        "success": True,
        "message": "Quiz started successfully. Students can now take the quiz.",
        "data": updated_quiz,
    }


# ── Teacher: end quiz ─────────────────────────────────────────────────────────

def end_quiz(conn, classroom_id: int, quiz_id: int, owner_id: int) -> dict:
    _verify_owner(conn, classroom_id, owner_id)

    with conn.cursor() as cur:
        cur.execute("SELECT status FROM quizzes WHERE id = %s AND classroom_id = %s", (quiz_id, classroom_id))
        quiz = cur.fetchone()

    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    if quiz["status"] != "ACTIVE":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only active quizzes can be ended")

    # Mark all IN_PROGRESS submissions as TIMED_OUT
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE quiz_submissions
            SET status = 'TIMED_OUT', submitted_at = NOW()
            WHERE quiz_id = %s AND status = 'IN_PROGRESS'
            """,
            (quiz_id,),
        )

    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE quizzes SET status = 'ENDED', updated_at = NOW()
            WHERE id = %s
            RETURNING id, classroom_id, title, description, scheduled_at, duration_minutes,
                      total_marks, is_published, status, created_by, created_at, updated_at
            """,
            (quiz_id,),
        )
        updated_quiz = _serialize(dict(cur.fetchone()))

    return {
        "success": True,
        "message": "Quiz ended successfully",
        "data": updated_quiz,
    }


# ── Teacher: delete quiz ──────────────────────────────────────────────────────

def delete_quiz(conn, classroom_id: int, quiz_id: int, owner_id: int) -> dict:
    _verify_owner(conn, classroom_id, owner_id)

    with conn.cursor() as cur:
        cur.execute(
            "DELETE FROM quizzes WHERE id = %s AND classroom_id = %s RETURNING id",
            (quiz_id, classroom_id),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    delete_classroom_event(conn, reference_id=quiz_id, event_type="QUIZ")

    return {
        "success": True,
        "message": "Quiz deleted successfully",
        "data": None,
    }


# ── Teacher: list all quizzes ─────────────────────────────────────────────────

def get_quizzes_teacher(conn, classroom_id: int, owner_id: int) -> dict:
    _verify_owner(conn, classroom_id, owner_id)

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, classroom_id, title, description, scheduled_at, duration_minutes,
                   total_marks, is_published, status, created_by, created_at, updated_at
            FROM quizzes
            WHERE classroom_id = %s
            ORDER BY created_at DESC
            """,
            (classroom_id,),
        )
        rows = cur.fetchall()

    quizzes = []
    for r in rows:
        q = _serialize(dict(r))
        q["questions"] = _get_questions_for_teacher(conn, q["id"])
        quizzes.append(q)

    return {
        "success": True,
        "message": "Quizzes fetched successfully",
        "data": quizzes,
    }


# ── Teacher: get quiz results ─────────────────────────────────────────────────

def get_quiz_results(conn, classroom_id: int, quiz_id: int, owner_id: int) -> dict:
    _verify_owner(conn, classroom_id, owner_id)

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                qs.id, qs.student_id, qs.started_at, qs.submitted_at,
                qs.marks_obtained, qs.status,
                u.full_name AS student_name, u.email AS student_email
            FROM quiz_submissions qs
            JOIN users u ON u.id = qs.student_id
            WHERE qs.quiz_id = %s
            ORDER BY qs.marks_obtained DESC
            """,
            (quiz_id,),
        )
        rows = cur.fetchall()

    results = []
    for r in rows:
        r = dict(r)
        result = _serialize({k: v for k, v in r.items() if k not in ("student_name", "student_email")})
        result["student"] = {
            "id": r["student_id"],
            "full_name": r["student_name"],
            "email": r["student_email"],
        }
        results.append(result)

    return {
        "success": True,
        "message": "Quiz results fetched successfully",
        "data": results,
    }


# ── Student: list available quizzes ──────────────────────────────────────────

def get_quizzes_student(conn, classroom_id: int, student_id: int) -> dict:
    _verify_enrolled(conn, classroom_id, student_id)

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, classroom_id, title, description, scheduled_at,
                   duration_minutes, total_marks, status, created_at
            FROM quizzes
            WHERE classroom_id = %s AND is_published = TRUE
            ORDER BY scheduled_at ASC
            """,
            (classroom_id,),
        )
        rows = cur.fetchall()

    return {
        "success": True,
        "message": "Quizzes fetched successfully",
        "data": [_serialize(dict(r)) for r in rows],
    }


# ── Student: start taking a quiz ──────────────────────────────────────────────

def start_taking_quiz(conn, classroom_id: int, quiz_id: int, student_id: int) -> dict:
    _verify_enrolled(conn, classroom_id, student_id)

    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, status, duration_minutes, is_published FROM quizzes WHERE id = %s AND classroom_id = %s",
            (quiz_id, classroom_id),
        )
        quiz = cur.fetchone()

    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    if not quiz["is_published"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quiz is not available yet")

    if quiz["status"] != "ACTIVE":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quiz is not active right now")

    # Check if already submitted
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, status FROM quiz_submissions WHERE quiz_id = %s AND student_id = %s",
            (quiz_id, student_id),
        )
        existing = cur.fetchone()

    if existing:
        if existing["status"] in ("SUBMITTED", "TIMED_OUT"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You have already submitted this quiz")
        # Already in progress — return questions again
        submission_id = existing["id"]
    else:
        # Create submission record
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO quiz_submissions (quiz_id, student_id)
                VALUES (%s, %s)
                RETURNING id
                """,
                (quiz_id, student_id),
            )
            submission_id = cur.fetchone()["id"]

    questions = _get_questions_for_student(conn, quiz_id)

    return {
        "success": True,
        "message": "Quiz started. Good luck!",
        "data": {
            "submission_id": submission_id,
            "duration_minutes": quiz["duration_minutes"],
            "questions": questions,
        },
    }


# ── Student: submit quiz answers ──────────────────────────────────────────────

def submit_quiz(conn, classroom_id: int, quiz_id: int, student_id: int, answers: list) -> dict:
    _verify_enrolled(conn, classroom_id, student_id)

    # Verify quiz is active
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, status FROM quizzes WHERE id = %s AND classroom_id = %s",
            (quiz_id, classroom_id),
        )
        quiz = cur.fetchone()

    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    if quiz["status"] not in ("ACTIVE", "ENDED"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quiz is not active")

    # Get submission
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, status FROM quiz_submissions WHERE quiz_id = %s AND student_id = %s",
            (quiz_id, student_id),
        )
        submission = cur.fetchone()

    if not submission:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You have not started this quiz yet")

    if submission["status"] in ("SUBMITTED", "TIMED_OUT"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You have already submitted this quiz")

    # Fetch correct answers
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, correct_option, marks FROM quiz_questions WHERE quiz_id = %s",
            (quiz_id,),
        )
        correct_map = {r["id"]: r for r in cur.fetchall()}

    # Save answers and calculate marks
    total_obtained = 0
    for answer in answers:
        question = correct_map.get(answer.question_id)
        if not question:
            continue

        is_correct = answer.selected_option.upper() == question["correct_option"]
        if is_correct:
            total_obtained += question["marks"]

        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO quiz_answers (submission_id, question_id, selected_option, is_correct)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (submission_id, question_id) DO UPDATE
                    SET selected_option = EXCLUDED.selected_option,
                        is_correct      = EXCLUDED.is_correct
                """,
                (submission["id"], answer.question_id, answer.selected_option.upper(), is_correct),
            )

    # Update submission
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE quiz_submissions
            SET status = 'SUBMITTED', submitted_at = NOW(), marks_obtained = %s
            WHERE id = %s
            RETURNING id, quiz_id, student_id, started_at, submitted_at, marks_obtained, status
            """,
            (total_obtained, submission["id"]),
        )
        final_submission = _serialize(dict(cur.fetchone()))

    return {
        "success": True,
        "message": "Quiz submitted successfully",
        "data": {
            **final_submission,
            "correct_answers": total_obtained,
        },
    }


# ── Student: view own result ──────────────────────────────────────────────────

def get_my_quiz_result(conn, classroom_id: int, quiz_id: int, student_id: int) -> dict:
    _verify_enrolled(conn, classroom_id, student_id)

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, quiz_id, student_id, started_at, submitted_at, marks_obtained, status
            FROM quiz_submissions
            WHERE quiz_id = %s AND student_id = %s
            """,
            (quiz_id, student_id),
        )
        submission = cur.fetchone()

    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="You have not taken this quiz")

    submission = _serialize(dict(submission))

    # Get answers with question details
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                qa.question_id, qa.selected_option, qa.is_correct,
                qq.question_text, qq.correct_option, qq.marks
            FROM quiz_answers qa
            JOIN quiz_questions qq ON qq.id = qa.question_id
            WHERE qa.submission_id = %s
            ORDER BY qq.order_index ASC
            """,
            (submission["id"],),
        )
        answers = [dict(r) for r in cur.fetchall()]

    submission["answers"] = answers

    return {
        "success": True,
        "message": "Quiz result fetched successfully",
        "data": submission,
    }


def create_quiz_by_agent(
    conn,
    classroom_id: int,
    created_by: int,
    title: str,
    description: str,
    scheduled_at,
    duration_minutes: int,
    is_published: bool,
    questions: list,
) -> bool:

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO quizzes
                    (classroom_id, title, description, scheduled_at, duration_minutes, is_published, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, classroom_id, title, description, scheduled_at, duration_minutes,
                          total_marks, is_published, status, created_by, created_at, updated_at
                """,
                (
                    classroom_id,
                    title,
                    description,
                    scheduled_at,
                    duration_minutes,
                    is_published,
                    created_by,
                ),
            )
            quiz = _serialize(dict(cur.fetchone()))

        # Insert questions
        inserted_questions = []
        for q in questions:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO quiz_questions
                        (quiz_id, question_text, option_a, option_b, option_c, option_d,
                         correct_option, marks, order_index)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, question_text, option_a, option_b, option_c, option_d,
                              correct_option, marks, order_index
                    """,
                    (
                        quiz["id"],
                        q.question_text,
                        q.option_a,
                        q.option_b,
                        q.option_c,
                        q.option_d,
                        q.correct_option,
                        q.marks,
                        q.order_index,
                    ),
                )
                inserted_questions.append(dict(cur.fetchone()))

        # Update total marks
        total = _recalculate_total_marks(conn, quiz["id"])
        quiz["total_marks"] = total
        quiz["questions"] = inserted_questions

        # Auto-create calendar event
        create_classroom_event(
            conn,
            classroom_id=classroom_id,
            title=f"Quiz: {title}",
            description=description,
            event_date=scheduled_at,
            event_type="QUIZ",
            reference_id=quiz["id"],
            created_by=created_by,
        )

        return True

    except Exception:
        conn.rollback()
        return False

def get_quiz_details(conn, classroom_id: int, quiz_id: int, student_id: int) -> dict:
    _verify_enrolled(conn, classroom_id, student_id)

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                id,
                classroom_id,
                title,
                description,
                scheduled_at,
                duration_minutes,
                total_marks,
                status,
                is_published
            FROM quizzes
            WHERE id = %s
              AND classroom_id = %s
              AND is_published = TRUE
            """,
            (quiz_id, classroom_id),
        )

        quiz = cur.fetchone()

    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found",
        )

    quiz = _serialize(dict(quiz))

    # Don't expose correct answers
    quiz["questions"] = _get_questions_for_student(conn, quiz_id)

    return {
        "success": True,
        "message": "Quiz fetched successfully",
        "data": quiz,
    }


# def get_student_submissions(conn, classroom_id: int, student_id: int):
#     with conn.cursor() as cur:
#         cur.execute(
#             """
#             SELECT
#                 qs.id AS submission_id,
#                 q.id AS quiz_id,
#                 q.title,
#                 qs.marks_obtained,
#                 q.total_marks,
#                 qs.status,
#     qs.submitted_at
# FROM quiz_submissions qs
# JOIN quizzes q
# ON qs.quiz_id = q.id
# WHERE
#     qs.student_id = %s
#     AND q.classroom_id = %s
# ORDER BY qs.submitted_at DESC;
#             """,
#             (student_id, classroom_id),
#         )
#         rows = cur.fetchall()

#     return success_response(
#         "Submissions fetched successfully",
#         rows,
#     )