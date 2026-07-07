from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]

def get_classroom_people(conn, classroom_id: int) -> dict:
    with conn.cursor() as cur:
        # 1. Fetch Teacher info
        cur.execute(
            """
            SELECT u.id, u.full_name, u.email
            FROM classrooms c
            JOIN users u ON u.id = c.owner_id
            WHERE c.id = %s
            """,
            (classroom_id,),
        )
        teacher = cur.fetchone()

        # 2. Fetch Students info
        cur.execute(
            """
            SELECT u.id, u.full_name, u.email
            FROM enrollments e
            JOIN users u ON u.id = e.student_id
            WHERE e.classroom_id = %s AND e.status = 'ACTIVE'
            """,
            (classroom_id,),
        )
        students = cur.fetchall()

    return {
        "success": True,
        "message": "People fetched successfully",
        "data": {
            "teacher": {
                "id": teacher["id"],
                "full_name": teacher["full_name"],
                "email": teacher["email"],
                "role": "Teacher"
            },
            "students": [
                {
                    "id": s["id"],
                    "full_name": s["full_name"],
                    "email": s["email"],
                    "role": "Student"
                }
                for s in students
            ],
        },
    }