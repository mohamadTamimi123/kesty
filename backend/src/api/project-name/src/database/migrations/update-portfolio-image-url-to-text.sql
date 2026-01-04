-- Update portfolio_images.image_url column from varchar(500) to text
-- This allows storing base64 data URLs which can be much longer than 500 characters

ALTER TABLE portfolio_images 
ALTER COLUMN image_url TYPE TEXT;

