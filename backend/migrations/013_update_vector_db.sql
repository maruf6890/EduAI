CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL
        REFERENCES chat_sessions(id)
        ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL,
    message JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id
ON chat_messages(session_id);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id
ON chat_sessions(user_id);


-- ALTER TABLE chat_messages
-- ADD COLUMN result_reference JSONB,
-- ADD COLUMN route_used TEXT;



drop table classroom_embeddings;
drop table classroom_documents;


drop table if EXISTS material_files;
drop table if exists materials;


CREATE TABLE IF NOT EXISTS materials (
    id           BIGSERIAL           PRIMARY KEY,
    classroom_id BIGINT              NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    title        VARCHAR(255)        NOT NULL,
    description  TEXT,
    visibility   material_visibility NOT NULL DEFAULT 'CENTRAL',
    url          VARCHAR(500)        NOT NULL,
    uploaded_by  BIGINT              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_materials_classroom   ON materials(classroom_id);
CREATE INDEX IF NOT EXISTS idx_materials_uploaded_by ON materials(uploaded_by);

CREATE TABLE if NOT EXISTS classroom_documents (
    id SERIAL PRIMARY KEY,
    classroom_id INT NOT NULL,
    material_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    foreign key (material_id) references materials(id) on delete cascade
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