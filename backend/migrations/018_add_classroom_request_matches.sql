
ALTER TABLE classroom_requests
    DROP COLUMN IF EXISTS resulting_classroom_id;

CREATE TABLE IF NOT EXISTS classroom_request_matches (
    id                   BIGSERIAL   PRIMARY KEY,
    classroom_request_id BIGINT     NOT NULL REFERENCES classroom_requests(id) ON DELETE CASCADE,
    classroom_id         BIGINT     NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_request_match UNIQUE (classroom_request_id, classroom_id)
);

CREATE INDEX IF NOT EXISTS idx_request_matches_request   ON classroom_request_matches(classroom_request_id);
CREATE INDEX IF NOT EXISTS idx_request_matches_classroom ON classroom_request_matches(classroom_id);