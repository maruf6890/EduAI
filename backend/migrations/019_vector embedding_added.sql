CREATE TABLE IF NOT EXISTS community_classrooms_embeddings (
    id SERIAL PRIMARY KEY,
    community_classroom_id INT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(3072),
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_community_classroom
        FOREIGN KEY (community_classroom_id)
        REFERENCES classrooms(id)
        ON DELETE CASCADE
); 
ALTER TABLE classroom_requests
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS embedding vector(3072);

ALTER TABLE classrooms
ADD COLUMN IF NOT EXISTS embedding vector(3072);

ALTER TABLE community_classrooms_embeddings
DROP COLUMN IF EXISTS content;