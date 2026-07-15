from app.ai.services.rag_services import extract_docs_with_chunking


def test_extract():

    docs = extract_docs_with_chunking(
        pdf_file="docs/self_rag.pdf",
        title="Database Notes",
        description="DBMS lecture notes",
        classroom_id="1",
        doc_type="central",
        created_by="teacher1"
    )

    print("Total chunks:", len(docs))

    for doc in docs[:2]:
        print("\nCONTENT:")
        print(doc.page_content[:200])

        print("\nMETADATA:")
        print(doc.metadata)


if __name__ == "__main__":
    test_extract()