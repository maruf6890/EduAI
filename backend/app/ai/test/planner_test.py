from app.ai.agents.panner_agent import generate_learning_plan
import json


def main():
    test_topics = [
        "Database Management System",
        "Machine Learning",
        "React Fundamentals",
        "Physics: Newton's Laws",
    ]

    for topic in test_topics:
        print("\n" + "=" * 60)
        print("Topic:", topic)

        result = generate_learning_plan(
            topic=topic,
            max_attempts=3
        )

        print("\nAttempts:", result.attempts)

        if result.final_plan:
            print("\nGenerated Plan:")
            print(json.dumps(
                result.final_plan,
                indent=2
            ))

            # Extra checking
            flow = result.final_plan["flow"]

            print("\nNodes:")
            for node in flow["nodes"]:
                print(
                    f"- {node['id']} | "
                    f"{node['type']} | "
                    f"{node['data']['label']}"
                )

            print("\nEdges:")
            for edge in flow["edges"]:
                print(
                    f"- {edge['source']} -> {edge['target']}"
                )

        else:
            print("\nFAILED:")
            print(result.failure_reason)


if __name__ == "__main__":
    main()