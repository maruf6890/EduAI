-- =====================================================================
-- Migration: chat_messages updates + materials/classroom_documents/
--            classroom_embeddings rebuild
-- All statements are idempotent and safe to re-run.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Drop old tables (children before parents)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS classroom_embeddings;
DROP TABLE IF EXISTS classroom_documents;
DROP TABLE IF EXISTS material_files;
DROP TABLE IF EXISTS materials;


-- ---------------------------------------------------------------------
-- materials
-- ---------------------------------------------------------------------
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

-- Keep updated_at accurate on every UPDATE (DEFAULT NOW() only fires on INSERT)
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_materials_updated_at ON materials;
CREATE TRIGGER trg_materials_updated_at
    BEFORE UPDATE ON materials
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();


-- ---------------------------------------------------------------------
-- classroom_documents
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS classroom_documents (
    id           BIGSERIAL   PRIMARY KEY,
    classroom_id BIGINT      NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    material_id  BIGINT      NOT NULL REFERENCES materials(id)  ON DELETE CASCADE,
    created_at   TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classroom_documents_classroom_id
    ON classroom_documents(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_documents_material_id
    ON classroom_documents(material_id);


-- ---------------------------------------------------------------------
-- classroom_embeddings
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS classroom_embeddings (
    id            BIGSERIAL   PRIMARY KEY,
    document_id   BIGINT      NOT NULL
        REFERENCES classroom_documents(id)
        ON DELETE CASCADE,
    chunk_number  INT,
    content       TEXT        NOT NULL,
    embedding     vector(768) NOT NULL,
    metadata      JSONB,
    created_at    TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classroom_embeddings_document_id
    ON classroom_embeddings(document_id);