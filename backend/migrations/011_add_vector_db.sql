CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE if NOT EXISTS classroom_documents (
    id SERIAL PRIMARY KEY,
    classroom_id INT NOT NULL,
    uploaded_by INT NOT NULL,
    document_name TEXT NOT NULL,
    file_type VARCHAR(50),
    total_pages INT,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS classroom_embeddings (
    id SERIAL PRIMARY KEY,

    document_id INT NOT NULL,

    chunk_number INT,

    content TEXT NOT NULL,

    embedding vector(768) NOT NULL,

    metadata JSONB,

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_document
    FOREIGN KEY(document_id)
    REFERENCES classroom_documents(id)
    ON DELETE CASCADE
);