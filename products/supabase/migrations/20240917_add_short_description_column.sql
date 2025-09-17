-- Add short_description column to products table
ALTER TABLE public.products 
ADD COLUMN short_description TEXT;

-- Update existing rows to have a default short_description if needed
UPDATE public.products 
SET short_description = substring(description, 1, 160) 
WHERE short_description IS NULL AND description IS NOT NULL;
