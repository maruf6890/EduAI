CREATE TABLE IF NOT EXISTS discussion_posts (
    id           BIGSERIAL    PRIMARY KEY,
    classroom_id BIGINT       NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    title        VARCHAR(255) NOT NULL,
    content      TEXT,
    created_by   BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discussion_comments (
    id         BIGSERIAL   PRIMARY KEY,
    post_id    BIGINT      NOT NULL REFERENCES discussion_posts(id) ON DELETE CASCADE,
    parent_id  BIGINT      REFERENCES discussion_comments(id) ON DELETE CASCADE,
    content    TEXT        NOT NULL,
    created_by BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discussion_posts_classroom ON discussion_posts(classroom_id);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_post   ON discussion_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_parent ON discussion_comments(parent_id);