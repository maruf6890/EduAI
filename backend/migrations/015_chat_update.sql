ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS tool_result JSONB;
