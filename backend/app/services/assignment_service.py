from datetime import datetime, timezone
from fastapi import HTTPException, status


# ── Helpers ──────────────────────────────────────────────────────────────────

def _serialize(row: dict) -> dict:
    row = dict(row)
    for field in ("created_at", "updated_at", "due_date", "submitted_at", "graded_at", "uploaded_at"):
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


def _get_assignment_files(conn, assignment_id: int) -> list:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, file_name, file_url, file_type, uploaded_at FROM assignment_files WHERE assignment_id = %s ORDER BY uploaded_at ASC",
            (assignment_id,),
        )
        return [_serialize(dict(r)) for r in cur.fetchall()]


def _get_submission_files(conn, submission_id: int) -> list:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, file_name, file_url, file_type, uploaded_at FROM submission_files WHERE submission_id = %s ORDER BY uploaded_at ASC",
            (submission_id,),
        )
        return [_serialize(dict(r)) for r in cur.fetchall()]


# ── Teacher: create assignment + optional files in one shot ──────────────────

async def create_assignment(
    conn,
    classroom_id: int,
    created_by: int,
    title: str,
    description,
    total_marks,
    due_date,
    allow_late_submission: bool,
    is_published: bool,
    files: list,          # list of UploadFile, can be empty
) -> dict:
    _verify_owner(conn, classroom_id, created_by)

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO assignments
                (classroom_id, title, description, total_marks, due_date, allow_late_submission, is_published, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, classroom_id, title, description, total_marks, due_date,
                      allow_late_submission, is_published, created_by, created_at, updated_at
            """,
            (classroom_id, title, description, total_marks, due_date, allow_late_submission, is_published, created_by),
        )
        assignment = _serialize(dict(cur.fetchone()))

    # Upload files to cloudinary and save records
    uploaded_files = []
    if files:
        from app.utils.cloudinary import upload_file_to_cloudinary
        for file in files:
            if not file.filename:
                continue
            file_data = await upload_file_to_cloudinary(
                file,
                folder=f"ai_classroom/assignments/{assignment['id']}",
            )
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO assignment_files (assignment_id, file_name, file_url, file_type)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, file_name, file_url, file_type, uploaded_at
                    """,
                    (assignment["id"], file_data["original_filename"], file_data["url"], file_data["file_type"]),
                )
                uploaded_files.append(_serialize(dict(cur.fetchone())))

    assignment["files"] = uploaded_files

    return {
        "success": True,
        "message": "Assignment created successfully",
        "data": assignment,
    }


# ── Teacher: update assignment ───────────────────────────────────────────────

def update_assignment(conn, classroom_id: int, assignment_id: int, owner_id: int, **fields) -> dict:
    _verify_owner(conn, classroom_id, owner_id)

    updates = {k: v for k, v in fields.items() if v is not None}
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    set_clause = ", ".join(f"{k} = %s" for k in updates)
    values = list(updates.values()) + [assignment_id, classroom_id]

    with conn.cursor() as cur:
        cur.execute(
            f"""
            UPDATE assignments SET {set_clause}, updated_at = NOW()
            WHERE id = %s AND classroom_id = %s
            RETURNING id, classroom_id, title, description, total_marks, due_date,
                      allow_late_submission, is_published, created_by, created_at, updated_at
            """,
            values,
        )
        assignment = cur.fetchone()

    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    assignment = _serialize(dict(assignment))
    assignment["files"] = _get_assignment_files(conn, assignment["id"])

    return {
        "success": True,
        "message": "Assignment updated successfully",
        "data": assignment,
    }


# ── Teacher: delete assignment ───────────────────────────────────────────────

def delete_assignment(conn, classroom_id: int, assignment_id: int, owner_id: int) -> dict:
    _verify_owner(conn, classroom_id, owner_id)

    with conn.cursor() as cur:
        cur.execute(
            "DELETE FROM assignments WHERE id = %s AND classroom_id = %s RETURNING id",
            (assignment_id, classroom_id),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    return {
        "success": True,
        "message": "Assignment deleted successfully",
        "data": None,
    }


# ── List all assignments in a classroom ──────────────────────────────────────

def get_assignments(conn, classroom_id: int, user_id: int) -> dict:
    with conn.cursor() as cur:
        cur.execute("SELECT owner_id FROM classrooms WHERE id = %s", (classroom_id,))
        classroom = cur.fetchone()

    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    is_owner = classroom["owner_id"] == user_id
    if not is_owner:
        _verify_enrolled(conn, classroom_id, user_id)

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, classroom_id, title, description, total_marks, due_date,
                   allow_late_submission, is_published, created_by, created_at, updated_at
            FROM assignments
            WHERE classroom_id = %s
            ORDER BY created_at DESC
            """,
            (classroom_id,),
        )
        rows = cur.fetchall()

    assignments = []
    for r in rows:
        a = _serialize(dict(r))
        a["files"] = _get_assignment_files(conn, a["id"])
        assignments.append(a)

    return {
        "success": True,
        "message": "Assignments fetched successfully",
        "data": assignments,
    }


# ── Get single assignment ────────────────────────────────────────────────────

def get_assignment(conn, classroom_id: int, assignment_id: int, user_id: int) -> dict:
    with conn.cursor() as cur:
        cur.execute("SELECT owner_id FROM classrooms WHERE id = %s", (classroom_id,))
        classroom = cur.fetchone()

    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    is_owner = classroom["owner_id"] == user_id
    if not is_owner:
        _verify_enrolled(conn, classroom_id, user_id)

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, classroom_id, title, description, total_marks, due_date,
                   allow_late_submission, is_published, created_by, created_at, updated_at
            FROM assignments WHERE id = %s AND classroom_id = %s
            """,
            (assignment_id, classroom_id),
        )
        assignment = cur.fetchone()

    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    assignment = _serialize(dict(assignment))
    assignment["files"] = _get_assignment_files(conn, assignment["id"])

    return {
        "success": True,
        "message": "Assignment fetched successfully",
        "data": assignment,
    }


# ── Student: submit assignment (text and/or files in one shot) ───────────────

async def submit_assignment(
    conn,
    classroom_id: int,
    assignment_id: int,
    student_id: int,
    submission_text,
    files: list,
) -> dict:
    _verify_enrolled(conn, classroom_id, student_id)

    if not submission_text and not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide submission_text or at least one file")

    # Fetch assignment
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, due_date, allow_late_submission, is_published FROM assignments WHERE id = %s AND classroom_id = %s",
            (assignment_id, classroom_id),
        )
        assignment = cur.fetchone()

    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    if not assignment["is_published"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assignment is not published yet")

    # Determine submission status
    now = datetime.now(timezone.utc)
    sub_status = "SUBMITTED"

    if assignment["due_date"]:
        due = assignment["due_date"]
        if due.tzinfo is None:
            due = due.replace(tzinfo=timezone.utc)
        if now > due:
            if not assignment["allow_late_submission"]:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Due date has passed and late submission is not allowed")
            sub_status = "LATE"

    # Upsert submission
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO assignment_submissions (assignment_id, student_id, submission_text, status, submitted_at)
            VALUES (%s, %s, %s, %s, NOW())
            ON CONFLICT (assignment_id, student_id)
            DO UPDATE SET
                submission_text = EXCLUDED.submission_text,
                status          = EXCLUDED.status,
                submitted_at    = NOW(),
                updated_at      = NOW()
            RETURNING id, assignment_id, student_id, submission_text,
                      marks_obtained, feedback, status, submitted_at, graded_at, created_at, updated_at
            """,
            (assignment_id, student_id, submission_text, sub_status),
        )
        submission = _serialize(dict(cur.fetchone()))

    # Upload files and save
    uploaded_files = []
    if files:
        from app.utils.cloudinary import upload_file_to_cloudinary
        for file in files:
            if not file.filename:
                continue
            file_data = await upload_file_to_cloudinary(
                file,
                folder=f"ai_classroom/submissions/{submission['id']}",
            )
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO submission_files (submission_id, file_name, file_url, file_type)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, file_name, file_url, file_type, uploaded_at
                    """,
                    (submission["id"], file_data["original_filename"], file_data["url"], file_data["file_type"]),
                )
                uploaded_files.append(_serialize(dict(cur.fetchone())))

    submission["files"] = uploaded_files

    return {
        "success": True,
        "message": "Assignment submitted successfully",
        "data": submission,
    }


# ── Student: view own submission ─────────────────────────────────────────────

def get_my_submission(conn, classroom_id: int, assignment_id: int, student_id: int) -> dict:
    _verify_enrolled(conn, classroom_id, student_id)

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, assignment_id, student_id, submission_text,
                   marks_obtained, feedback, status, submitted_at, graded_at, created_at, updated_at
            FROM assignment_submissions
            WHERE assignment_id = %s AND student_id = %s
            """,
            (assignment_id, student_id),
        )
        submission = cur.fetchone()

    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No submission found")

    submission = _serialize(dict(submission))
    submission["files"] = _get_submission_files(conn, submission["id"])

    return {
        "success": True,
        "message": "Submission fetched successfully",
        "data": submission,
    }


# ── Teacher: view all submissions ────────────────────────────────────────────

def get_all_submissions(conn, classroom_id: int, assignment_id: int, owner_id: int) -> dict:
    _verify_owner(conn, classroom_id, owner_id)

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                s.id, s.assignment_id, s.submission_text, s.marks_obtained,
                s.feedback, s.status, s.submitted_at, s.graded_at, s.created_at, s.updated_at,
                u.id        AS student_id,
                u.full_name AS student_name,
                u.email     AS student_email
            FROM assignment_submissions s
            JOIN users u ON u.id = s.student_id
            WHERE s.assignment_id = %s
            ORDER BY s.submitted_at ASC
            """,
            (assignment_id,),
        )
        rows = cur.fetchall()

    submissions = []
    for r in rows:
        r = dict(r)
        sub = _serialize({k: v for k, v in r.items() if k not in ("student_name", "student_email")})
        sub["student"] = {
            "id": r["student_id"],
            "full_name": r["student_name"],
            "email": r["student_email"],
        }
        sub["files"] = _get_submission_files(conn, sub["id"])
        submissions.append(sub)

    return {
        "success": True,
        "message": "Submissions fetched successfully",
        "data": submissions,
    }


# ── Teacher: grade a submission ──────────────────────────────────────────────

def grade_submission(conn, classroom_id: int, assignment_id: int, student_id: int, owner_id: int, marks_obtained: float, feedback) -> dict:
    _verify_owner(conn, classroom_id, owner_id)

    with conn.cursor() as cur:
        cur.execute("SELECT total_marks FROM assignments WHERE id = %s", (assignment_id,))
        assignment = cur.fetchone()

    if assignment and assignment["total_marks"] and marks_obtained > assignment["total_marks"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"marks_obtained cannot exceed total_marks ({assignment['total_marks']})",
        )

    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE assignment_submissions
            SET marks_obtained = %s, feedback = %s, status = 'GRADED', graded_at = NOW(), updated_at = NOW()
            WHERE assignment_id = %s AND student_id = %s
            RETURNING id, assignment_id, student_id, submission_text,
                      marks_obtained, feedback, status, submitted_at, graded_at, created_at, updated_at
            """,
            (marks_obtained, feedback, assignment_id, student_id),
        )
        submission = cur.fetchone()

    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    submission = _serialize(dict(submission))
    submission["files"] = _get_submission_files(conn, submission["id"])

    return {
        "success": True,
        "message": "Submission graded successfully",
        "data": submission,
    }