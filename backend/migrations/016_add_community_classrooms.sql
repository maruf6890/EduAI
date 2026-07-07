-- ── Community classrooms support ─────────────────────────────────────────────

DO $$ BEGIN
    CREATE TYPE classroom_type AS ENUM ('NORMAL', 'COMMUNITY');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- New columns
ALTER TABLE classrooms
    ADD COLUMN IF NOT EXISTS classroom_type classroom_type NOT NULL DEFAULT 'NORMAL';

ALTER TABLE classrooms
    ADD COLUMN IF NOT EXISTS topic_slug VARCHAR(255);

-- Community classrooms have no single teacher owner
ALTER TABLE classrooms
    ALTER COLUMN owner_id DROP NOT NULL;

-- Community classrooms don't need a formal course code
ALTER TABLE classrooms
    ALTER COLUMN course_code DROP NOT NULL;

-- Community classrooms don't need a join code (users are auto-joined by topic)
ALTER TABLE classrooms
    ALTER COLUMN join_code DROP NOT NULL;

-- One community classroom per topic — enforced only for COMMUNITY rows
CREATE UNIQUE INDEX IF NOT EXISTS idx_community_topic_slug
    ON classrooms(topic_slug)
    WHERE classroom_type = 'COMMUNITY';

CREATE INDEX IF NOT EXISTS idx_classrooms_type ON classrooms(classroom_type);