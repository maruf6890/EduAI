

from app.agents.db import get_db
from app.ai.memory.agent_short_term_memories import get_short_term_memory
from app.ai.services.validate_query import validate_query
db_generator = get_db()
conn = next(db_generator)
def main():
    test_cases = [
        {
            "query": "Explain photosynthesis",
            "role": "student"
        },
        {
            "query": "Create a quiz about Newton's laws",
            "role": "teacher"
        },
        {
            "query": "Make a lesson plan for database course",
            "role": "teacher"
        },
        {
            "query": "amar physics bujhte problem hocche",
            "role": "student"
        },
    ]

    for case in test_cases:
        print("\n======================")
        print("Query:", case["query"])
        print("Given Role:", case["role"])

        result = validate_query(
            query=case["query"],
            role=case["role"]
        )
        print(result)
        if result:
            print("Detected Role:", result.role)
            print("Route:", result.route)
            print("Refined Query:", result.refined_query)
            print("Improper:", result.improper_query)
            print("Reason:", result.why_improper)


if __name__ == "__main__":
    main()