DO $$ BEGIN
    CREATE TYPE calendar_event_type AS ENUM ('ASSIGNMENT', 'QUIZ', 'ANNOUNCEMENT', 'TASK', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS calendar_events (
    id           BIGSERIAL           PRIMARY KEY,
    classroom_id BIGINT              REFERENCES classrooms(id) ON DELETE CASCADE,
    title        VARCHAR(255)        NOT NULL,
    description  TEXT,
    event_date   TIMESTAMPTZ         NOT NULL,
    event_type   calendar_event_type NOT NULL DEFAULT 'OTHER',
    reference_id BIGINT,
    created_by   BIGINT              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_personal  BOOLEAN             NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_classroom   ON calendar_events(classroom_id);
CREATE INDEX IF NOT EXISTS idx_calendar_created_by  ON calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_calendar_event_date  ON calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_event_type  ON calendar_events(event_type);