DO $$ BEGIN
    CREATE TYPE quiz_status AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'ENDED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE quiz_submission_status AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'TIMED_OUT');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS quizzes (
    id               BIGSERIAL    PRIMARY KEY,
    classroom_id     BIGINT       NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    scheduled_at     TIMESTAMPTZ,
    duration_minutes INTEGER      NOT NULL DEFAULT 30,
    total_marks      INTEGER      NOT NULL DEFAULT 0,
    is_published     BOOLEAN      NOT NULL DEFAULT FALSE,
    status           quiz_status  NOT NULL DEFAULT 'DRAFT',
    created_by       BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
    id             BIGSERIAL    PRIMARY KEY,
    quiz_id        BIGINT       NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text  TEXT         NOT NULL,
    option_a       VARCHAR(500) NOT NULL,
    option_b       VARCHAR(500) NOT NULL,
    option_c       VARCHAR(500),
    option_d       VARCHAR(500),
    correct_option CHAR(1)      NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    marks          INTEGER      NOT NULL DEFAULT 1,
    order_index    INTEGER      NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quiz_submissions (
    id             BIGSERIAL             PRIMARY KEY,
    quiz_id        BIGINT                NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id     BIGINT                NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at     TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
    submitted_at   TIMESTAMPTZ,
    marks_obtained DECIMAL(5,2)          DEFAULT 0,
    status         quiz_submission_status NOT NULL DEFAULT 'IN_PROGRESS',

    CONSTRAINT unique_quiz_submission UNIQUE (quiz_id, student_id)
);

CREATE TABLE IF NOT EXISTS quiz_answers (
    id              BIGSERIAL PRIMARY KEY,
    submission_id   BIGINT    NOT NULL REFERENCES quiz_submissions(id) ON DELETE CASCADE,
    question_id     BIGINT    NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    selected_option CHAR(1)   CHECK (selected_option IN ('A', 'B', 'C', 'D')),
    is_correct      BOOLEAN   NOT NULL DEFAULT FALSE,

    CONSTRAINT unique_answer UNIQUE (submission_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_quizzes_classroom    ON quizzes(classroom_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_status       ON quizzes(status);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz  ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions     ON quiz_submissions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers         ON quiz_answers(submission_id);