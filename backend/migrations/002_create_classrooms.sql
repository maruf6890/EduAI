CREATE TABLE IF NOT EXISTS classrooms (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    join_code    VARCHAR(10)  NOT NULL UNIQUE,
    course_code  VARCHAR(50)  NOT NULL,
    course_title VARCHAR(255) NOT NULL,
    description  TEXT,
    semester     VARCHAR(50),
    owner_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classrooms_owner     ON classrooms(owner_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_join_code ON classrooms(join_code);