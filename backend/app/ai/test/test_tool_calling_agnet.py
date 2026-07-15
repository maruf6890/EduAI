from app.ai.agents.tool_calling_agent import run_calendar_agent
from app.agents.db import get_db


db_generator = get_db()
conn = next(db_generator)


def test_calendar_agent():

    user_id = 1
    classroom_id = 1
    session_id = 1


    test_cases = [

        {
            "name": "Get calendar events",
            "query": "What events do I have this week?"
        },

        {
            "name": "Add personal event",
            "query": "Remind me tomorrow at 6pm to study database chapter"
        },

        {
            "name": "Ambiguous date",
            "query": "Add a reminder to study physics"
        },

        {
            "name": "Normal conversation",
            "query": "Explain what a database is"
        },

    ]


    for case in test_cases:

        print("\n==============================")
        print("TEST:", case["name"])
        print("QUERY:", case["query"])

        response = run_calendar_agent(
            conn=conn,
            user_id=user_id,
            classroom_id=classroom_id,
            session_id=session_id,
            user_query=case["query"]
        )


        print("\nASSISTANT:")
        print(response)



if __name__ == "__main__":
    test_calendar_agent()