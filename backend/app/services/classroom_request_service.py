from app.services.community_classroom_service import get_all_community_classrooms
from app.agents.community_class.classroom_match_graph import classroom_match


def _serialize(row: dict) -> dict:
    row = dict(row)
    if row.get("created_at"):
        row["created_at"] = row["created_at"].isoformat()
    if row.get("updated_at"):
        row["updated_at"] = row["updated_at"].isoformat()
    return row


def create_classroom_request(conn, user_id: int, title: str,  description: str) -> dict:
    final_state = classroom_match.invoke({
    "conn": conn,        
    "student_id": user_id,
    "title": title,
    "description": description,
    })




        

   

    return {
        "success": True,
        "message": "Your classroom request has been submitted",
        "data": final_state["result"],
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