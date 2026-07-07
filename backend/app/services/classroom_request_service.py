from app.services.community_classroom_service import get_all_community_classrooms


def _serialize(row: dict) -> dict:
    row = dict(row)
    if row.get("created_at"):
        row["created_at"] = row["created_at"].isoformat()
    if row.get("updated_at"):
        row["updated_at"] = row["updated_at"].isoformat()
    return row


def create_classroom_request(conn, user_id: int, title: str, description) -> dict:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO classroom_requests (title, description, requested_by)
            VALUES (%s, %s, %s)
            RETURNING id, title, description, requested_by, status, created_at, updated_at
            """,
            (title, description, user_id),
        )
        request = cur.fetchone()

    request_id = request["id"]

    # Find related community classrooms (enriched with role/has_teacher for this user)
    search_result = get_all_community_classrooms(conn, user_id, topic=title)
    matches = search_result["data"]

    # Record every match against this request — a request can match many classrooms
    if matches:
        with conn.cursor() as cur:
            for classroom in matches:
                cur.execute(
                    """
                    INSERT INTO classroom_request_matches (classroom_request_id, classroom_id)
                    VALUES (%s, %s)
                    ON CONFLICT (classroom_request_id, classroom_id) DO NOTHING
                    """,
                    (request_id, classroom["id"]),
                )

    data = _serialize(dict(request))
    data["matched_classrooms"] = matches

    return {
        "success": True,
        "message": "Your classroom request has been submitted",
        "data": data,
    }


def get_my_classroom_requests(conn, user_id: int) -> dict:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, title, description, requested_by, status, created_at, updated_at
            FROM classroom_requests
            WHERE requested_by = %s
            ORDER BY created_at DESC
            """,
            (user_id,),
        )
        rows = cur.fetchall()

    requests = []
    for r in rows:
        request = _serialize(dict(r))

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT c.id, c.name, c.course_title, c.owner_id
                FROM classroom_request_matches m
                JOIN classrooms c ON c.id = m.classroom_id
                WHERE m.classroom_request_id = %s
                """,
                (request["id"],),
            )
            request["matched_classrooms"] = [dict(m) for m in cur.fetchall()]

        requests.append(request)

    return {
        "success": True,
        "message": "Classroom requests fetched successfully",
        "data": requests,
    }