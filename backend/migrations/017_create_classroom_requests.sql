DO $$ BEGIN
    CREATE TYPE classroom_request_status AS ENUM ('PENDING', 'PROCESSED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS classroom_requests (
    id                     BIGSERIAL                 PRIMARY KEY,
    title                  VARCHAR(255)               NOT NULL,
    description            TEXT,
    requested_by           BIGINT                     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status                 classroom_request_status   NOT NULL DEFAULT 'PENDING',
    resulting_classroom_id BIGINT                     REFERENCES classrooms(id) ON DELETE SET NULL,
    created_at             TIMESTAMPTZ                NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ                NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classroom_requests_user   ON classroom_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_classroom_requests_status ON classroom_requests(status);
