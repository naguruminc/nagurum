-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    image_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Allow public read access
CREATE POLICY "Enable read access for all users" 
ON public.products 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- Allow insert for authenticated users (admin)
CREATE POLICY "Enable insert for authenticated users only" 
ON public.products 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow update for authenticated users (admin)
CREATE POLICY "Enable update for authenticated users only" 
ON public.products 
FOR UPDATE 
TO authenticated 
USING (true);

-- Allow delete for authenticated users (admin)
CREATE POLICY "Enable delete for authenticated users only" 
ON public.products 
FOR DELETE 
TO authenticated 
USING (true);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at column
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for product images
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Upload Access" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Update Access" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'product-images');

CREATE POLICY "Delete Access" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'product-images');
