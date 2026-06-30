DO $$ BEGIN
    CREATE TYPE enrollment_status AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS enrollments (
    id           SERIAL PRIMARY KEY,
    classroom_id INTEGER NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    student_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status       enrollment_status NOT NULL DEFAULT 'ACTIVE',

    -- one user can only enroll once per classroom
    CONSTRAINT unique_enrollment UNIQUE (classroom_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_classroom ON enrollments(classroom_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student   ON enrollments(student_id);