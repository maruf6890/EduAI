ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS tool_result JSONB;
ALTER TABLE classroom_embeddings
ALTER COLUMN embedding TYPE vector(3072);