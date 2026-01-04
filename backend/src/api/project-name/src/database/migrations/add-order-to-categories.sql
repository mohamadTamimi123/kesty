-- Migration: Add order column to categories table
-- This migration adds the 'order' column to the categories table for drag & drop functionality

-- Add order column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'order'
    ) THEN
        ALTER TABLE categories ADD COLUMN "order" INTEGER DEFAULT 0 NOT NULL;
    END IF;
END $$;

-- Create index on (parent_id, order) for better query performance
CREATE INDEX IF NOT EXISTS idx_categories_parent_order ON categories(parent_id, "order");

-- Initialize order values based on createdAt for existing categories
-- This ensures existing categories have a proper order
UPDATE categories c1
SET "order" = (
    SELECT COUNT(*) 
    FROM categories c2 
    WHERE (c2.parent_id IS NULL AND c1.parent_id IS NULL)
       OR (c2.parent_id = c1.parent_id)
      AND c2.created_at <= c1.created_at
      AND c2.id != c1.id
);

-- Add comment to column
COMMENT ON COLUMN categories."order" IS 'Order of category within its parent (for drag & drop)';

