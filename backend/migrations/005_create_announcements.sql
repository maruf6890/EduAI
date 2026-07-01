CREATE TABLE IF NOT EXISTS announcements (
    id           BIGSERIAL    PRIMARY KEY,
    classroom_id BIGINT       NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    title        VARCHAR(255) NOT NULL,
    content      TEXT,
    created_by   BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcement_files (
    id               BIGSERIAL    PRIMARY KEY,
    announcement_id  BIGINT       NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    file_name        VARCHAR(255) NOT NULL,
    file_url         VARCHAR(500) NOT NULL,
    file_type        VARCHAR(50),
    uploaded_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_classroom ON announcements(classroom_id);
CREATE INDEX IF NOT EXISTS idx_announcement_files      ON announcement_files(announcement_id);