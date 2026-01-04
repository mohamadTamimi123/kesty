-- Add metadata column to messages table for storing additional message data
-- This allows us to store project information and action buttons for rich messages

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add index for faster queries on metadata
CREATE INDEX IF NOT EXISTS idx_messages_metadata_type 
ON messages USING GIN (metadata jsonb_path_ops)
WHERE metadata IS NOT NULL;
