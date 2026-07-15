from app.ai.services.rag_services import (
    extract_docs_with_chunking,
    store_in_vector_db
)


def test_store():

    docs = extract_docs_with_chunking(
        pdf_file="docs/self_rag.pdf",
        title="Database Notes",
        description="DBMS lecture notes",
        classroom_id="1",
        doc_type="central",
        created_by="teacher1"
    )


    count = store_in_vector_db(docs)

    print("Stored chunks:", count)

test_store()