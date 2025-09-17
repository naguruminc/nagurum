-- Add images column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Update existing rows to have an empty array for images
UPDATE public.products 
SET images = '{}' 
WHERE images IS NULL;
