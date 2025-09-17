-- Add in_stock column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true;

-- Update existing rows to have in_stock = true by default
UPDATE public.products 
SET in_stock = true 
WHERE in_stock IS NULL;
