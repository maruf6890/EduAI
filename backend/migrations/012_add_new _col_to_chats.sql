ALTER TABLE chat_messages
ADD COLUMN result_reference JSONB,
ADD COLUMN route_used TEXT;