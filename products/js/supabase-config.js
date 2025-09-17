// Configuration
const SUPABASE_URL = 'https://ffwksvdrslvvyfjcclui.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmd2tzdmRyc2x2dnlmamNjbHVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NTA3NjcsImV4cCI6MjA3MzUyNjc2N30.Dt4rZFnTM5gRh86XIK9D8pDRHeXmNg7dcaG2U4arjtk';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmd2tzdmRyc2x2dnlmamNjbHVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk1MDc2NywiZXhwIjoyMDczNTI2NzY3fQ.ScwZMLsfJYK2jIJbP3MIVVrpsl3LyFg-muZwsy5klpc';

// Initialize Supabase client
let _supabase;

try {
  if (typeof supabase === 'undefined') {
    throw new Error('Supabase client is not loaded. Make sure you have included the Supabase client script.');
  }

  _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });

  // Make supabase available globally
  window.supabase = _supabase;
  
  console.log('Supabase initialized successfully');
} catch (error) {
  console.error('Failed to initialize Supabase:', error);
  throw new Error(`Supabase initialization failed: ${error.message}`);
}

// Export the supabase client
export { _supabase as supabase };

// Helper functions for products
const productsTable = 'products';

// Get all products
export const getProducts = async () => {
  const { data, error } = await supabase
    .from(productsTable)
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  return data;
};

// Get a single product by ID
export const getProductById = async (id) => {
  const { data, error } = await supabase
    .from(productsTable)
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }
  return data;
};

// Add a new product
export const addProduct = async (product) => {
  const { data, error } = await supabase
    .from(productsTable)
    .insert([product])
    .select();
  
  if (error) {
    console.error('Error adding product:', error);
    throw error;
  }
  return data[0];
};

// Update an existing product
export const updateProduct = async (id, updates) => {
  const { data, error } = await supabase
    .from(productsTable)
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) {
    console.error('Error updating product:', error);
    throw error;
  }
  return data[0];
};

// Delete a product
export const deleteProduct = async (id) => {
  const { error } = await supabase
    .from(productsTable)
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
  return true;
};

// Upload product image
export const uploadImage = async (file, path) => {
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(path, file);
  
  if (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
  
  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(path);
    
  return publicUrl;
};
