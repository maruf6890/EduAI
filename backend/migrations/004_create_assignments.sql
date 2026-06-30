CREATE TABLE IF NOT EXISTS assignments (
    id                    BIGSERIAL    PRIMARY KEY,
    classroom_id          BIGINT       NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    title                 VARCHAR(255) NOT NULL,
    description           TEXT,
    total_marks           INTEGER,
    due_date              TIMESTAMPTZ,
    allow_late_submission BOOLEAN      NOT NULL DEFAULT FALSE,
    is_published          BOOLEAN      NOT NULL DEFAULT FALSE,
    created_by            BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignment_files (
    id            BIGSERIAL    PRIMARY KEY,
    assignment_id BIGINT       NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    file_name     VARCHAR(255) NOT NULL,
    file_url      VARCHAR(500) NOT NULL,
    file_type     VARCHAR(50),
    uploaded_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    CREATE TYPE submission_status AS ENUM ('DRAFT', 'SUBMITTED', 'LATE', 'GRADED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS assignment_submissions (
    id              BIGSERIAL         PRIMARY KEY,
    assignment_id   BIGINT            NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id      BIGINT            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission_text TEXT,
    marks_obtained  DECIMAL(5,2),
    feedback        TEXT,
    status          submission_status NOT NULL DEFAULT 'DRAFT',
    submitted_at    TIMESTAMPTZ,
    graded_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_submission UNIQUE (assignment_id, student_id)
);

CREATE TABLE IF NOT EXISTS submission_files (
    id            BIGSERIAL    PRIMARY KEY,
    submission_id BIGINT       NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    file_name     VARCHAR(255) NOT NULL,
    file_url      VARCHAR(500) NOT NULL,
    file_type     VARCHAR(50),
    uploaded_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_classroom  ON assignments(classroom_id);
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_assignment_files       ON assignment_files(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student    ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submission_files       ON submission_files(submission_id);