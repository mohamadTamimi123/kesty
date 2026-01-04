-- Add unique constraint to conversations table
-- This prevents duplicate conversations for the same customer-supplier-project combination
-- Also handles the case where projectId is NULL (only one conversation per customer-supplier pair without project)

-- First, handle existing duplicates by keeping the oldest conversation and deleting others
-- For conversations with projectId
WITH duplicates_with_project AS (
  SELECT 
    id,
    customer_id,
    supplier_id,
    project_id,
    ROW_NUMBER() OVER (
      PARTITION BY customer_id, supplier_id, project_id 
      ORDER BY created_at ASC
    ) as rn
  FROM conversations
  WHERE project_id IS NOT NULL
)
DELETE FROM conversations
WHERE id IN (
  SELECT id FROM duplicates_with_project WHERE rn > 1
);

-- For conversations without projectId (keep only one per customer-supplier pair)
WITH duplicates_without_project AS (
  SELECT 
    id,
    customer_id,
    supplier_id,
    ROW_NUMBER() OVER (
      PARTITION BY customer_id, supplier_id 
      ORDER BY created_at ASC
    ) as rn
  FROM conversations
  WHERE project_id IS NULL
)
DELETE FROM conversations
WHERE id IN (
  SELECT id FROM duplicates_without_project WHERE rn > 1
);

-- Add unique constraint for conversations with projectId
-- PostgreSQL treats NULL values as distinct in unique constraints, so we need a partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_unique_with_project 
ON conversations(customer_id, supplier_id, project_id) 
WHERE project_id IS NOT NULL;

-- Add unique constraint for conversations without projectId
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_unique_without_project 
ON conversations(customer_id, supplier_id) 
WHERE project_id IS NULL;
