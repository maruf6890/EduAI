ALTER TABLE chat_messages
ALTER COLUMN message TYPE TEXT
USING message::TEXT;