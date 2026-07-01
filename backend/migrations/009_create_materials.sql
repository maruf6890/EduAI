DO $$ BEGIN
    CREATE TYPE material_visibility AS ENUM ('CENTRAL', 'PRIVATE');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS materials (
    id           BIGSERIAL           PRIMARY KEY,
    classroom_id BIGINT              NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    title        VARCHAR(255)        NOT NULL,
    description  TEXT,
    visibility   material_visibility NOT NULL DEFAULT 'CENTRAL',
    uploaded_by  BIGINT              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS material_files (
    id          BIGSERIAL    PRIMARY KEY,
    material_id BIGINT       NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    file_name   VARCHAR(255) NOT NULL,
    file_url    VARCHAR(500) NOT NULL,
    file_type   VARCHAR(50),
    uploaded_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materials_classroom   ON materials(classroom_id);
CREATE INDEX IF NOT EXISTS idx_materials_uploaded_by ON materials(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_material_files        ON material_files(material_id);