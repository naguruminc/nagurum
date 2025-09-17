-- Add sale_price and original_price columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2);

-- Update existing rows to set original_price = price
UPDATE public.products 
SET original_price = price 
WHERE original_price IS NULL;
