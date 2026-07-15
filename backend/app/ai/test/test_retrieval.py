from app.ai.services.rag_services import ensambled_retribal


def test_retrieval():

    docs = ensambled_retribal(
        query="What is self rag?",
        classroom_id="1",
        user_id="student1",
        k=5
    )


    print("Retrieved:", len(docs))


    for i,doc in enumerate(docs):

        print("\n---------")
        print("Rank:",i+1)

        print(doc.page_content[:300])

        print(doc.metadata)

test_retrieval()