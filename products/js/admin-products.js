// Get supabase from global scope
let supabase;

// Wait for supabase to be available
const checkSupabase = () => {
  return new Promise((resolve) => {
    const check = () => {
      if (window.supabase) {
        supabase = window.supabase;
        console.log('Supabase found:', !!supabase);
        resolve(true);
      } else {
        console.log('Waiting for supabase...');
        setTimeout(check, 100);
      }
    };
    check();
  });
};

// DOM Elements
const productsSection = document.getElementById('products-section');
const productFormSection = document.getElementById('product-form-section');
const productsTableBody = document.getElementById('products-table-body');
const productForm = document.getElementById('product-form');
const addProductBtn = document.getElementById('add-product-btn');
const backToProductsBtn = document.getElementById('back-to-products');
const cancelEditBtn = document.getElementById('cancel-edit');
const formTitle = document.getElementById('form-title');

let currentProductId = null;
let currentImageFiles = Array(4).fill(null);
let currentImageUrls = Array(4).fill('');

// Initialize the application
const initApp = async () => {
  try {
    console.log('Initializing application...');
    
    // Wait for supabase to be available
    await checkSupabase();
    
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    await loadProducts();
    
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Initialization error:', error);
    showError('Failed to initialize the application. Please check the console for details.');
  }
};

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function setupEventListeners() {
  // Navigation
  if (addProductBtn) {
    addProductBtn.addEventListener('click', showAddProductForm);
  }
  
  if (backToProductsBtn) {
    backToProductsBtn.addEventListener('click', showProductsList);
  }
  
  // Back to products button at bottom of form
  const backToProductsBottomBtn = document.getElementById('back-to-products-bottom');
  if (backToProductsBottomBtn) {
    backToProductsBottomBtn.addEventListener('click', showProductsList);
  }
  
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', cancelEdit);
  }
  
  // Form submission
  if (productForm) {
    productForm.addEventListener('submit', handleFormSubmit);
  }
  
  // Image upload
  document.querySelectorAll('.product-image').forEach(input => {
    input.addEventListener('change', handleImageUpload);
  });
  
  // Add specification button
  document.getElementById('add-specification')?.addEventListener('click', () => addSpecificationField());
  
  // Add heading button
  document.getElementById('add-heading')?.addEventListener('click', () => addSpecificationHeading());
  
  // Handle dynamic specification removal
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-spec')) {
      e.preventDefault();
      e.target.closest('.specification-row').remove();
    }
  });
  
  // Initialize with one empty specification field
  addSpecificationField();
}

// Get all products
const getProducts = async () => {
  console.log('Fetching products from Supabase...');
  
  try {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    console.log('Products fetched successfully:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error in getProducts:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      supabaseError: error.supabaseError
    });
    
    showError('Failed to load products. Please check the console for details.');
    return [];
  }
}

// Load all products
async function loadProducts() {
  console.log('Loading products...');
  
  try {
    if (!productsTableBody) {
      throw new Error('Products table element not found');
    }
    
    // Show loading state
    productsTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
          </div>
          <p class="mt-2">Loading products...</p>
        </td>
      </tr>`;
    
    const products = await getProducts();
    
    if (!Array.isArray(products)) {
      throw new Error('Invalid products data received');
    }
    
    renderProductsTable(products);
    
  } catch (error) {
    console.error('Error in loadProducts:', error);
    
    if (productsTableBody) {
      productsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-danger">
            <p>Failed to load products. Please try again.</p>
            <button class="btn btn-sm btn-outline-primary" onclick="window.location.reload()">
              <i class="fas fa-sync-alt me-1"></i> Reload
            </button>
          </td>
        </tr>`;
    }
    
    showError('Failed to load products. Please check the console for details.');
  }
}

// Render products table
function renderProductsTable(products) {
  if (products.length === 0) {
    productsTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4">
          No products found. Click "Add New Product" to get started.
        </td>
      </tr>
    `;
    return;
  }

  productsTableBody.innerHTML = products.map(product => `
    <tr data-id="${product.id}">
      <td>
        <img src="${product.image_url || 'images/placeholder-product.png'}" 
             alt="${product.name}" 
             class="img-fluid" 
             style="width: 60px; height: 60px; object-fit: cover;">
      </td>
      <td>${product.name}</td>
      <td>${product.category}</td>
      <td>${product.price.toFixed(2)}</td>
      <td>${product.in_stock ? 'In Stock' : 'Out of Stock'}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-outline-primary edit-product" data-id="${product.id}">
          <i class="far fa-edit"></i> Edit
        </button>
      </td>
    </tr>
  `).join('');

  // Add event listeners to edit buttons
  document.querySelectorAll('.edit-product').forEach(button => {
    button.addEventListener('click', (e) => {
      const productId = e.target.closest('button').dataset.id;
      editProduct(productId);
    });
  });
}

// Show add product form
function resetForm() {
  productForm.reset();
  currentProductId = null;
  currentImageFiles = Array(4).fill(null);
  currentImageUrls = Array(4).fill('');
  
  // Reset image previews
  document.querySelectorAll('.image-preview-container').forEach(container => {
    container.innerHTML = '';
  });
  
  // Reset file inputs
  document.querySelectorAll('.product-image').forEach(input => {
    input.value = '';
  });
  
  // Reset specifications
  const container = document.getElementById('specifications-container');
  if (container) {
    container.innerHTML = '';
    addSpecificationField(); // Add one empty field
  }
}

// Add a new specification field
function addSpecificationField(key = '', value = '', isHeading = false) {
  const container = document.getElementById('specifications-container');
  if (!container) return;
  
  const index = Date.now(); // Unique ID for the field
  
  const row = document.createElement('div');
  row.className = `row specification-row mb-3 ${isHeading ? 'specification-heading' : ''}`;
  
  if (isHeading) {
    row.innerHTML = `
      <div class="col-12">
        <div class="d-flex align-items-center">
          <input type="text" class="form-control font-weight-bold" placeholder="Section Heading" value="${key}">
          <button class="btn btn-outline-danger remove-spec ml-2" type="button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <input type="hidden" class="is-heading" value="true">
      </div>
    `;
  } else {
    row.innerHTML = `
      <div class="col-md-5">
        <input type="text" class="form-control spec-key" placeholder="Specification (e.g., Color)" value="${key}">
      </div>
      <div class="col-md-6">
        <div class="input-group">
          <input type="text" class="form-control spec-value" placeholder="Value (e.g., Black)" value="${value}">
          <div class="input-group-append">
            <button class="btn btn-outline-danger remove-spec" type="button">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  container.appendChild(row);
}

// Add a new specification heading
function addSpecificationHeading() {
  addSpecificationField('', '', true);
  // Scroll to the newly added heading
  const container = document.getElementById('specifications-container');
  container.lastElementChild.scrollIntoView({ behavior: 'smooth' });
}

// Get specifications from form
function getSpecifications() {
  const specs = [];
  const rows = document.querySelectorAll('.specification-row');
  
  rows.forEach(row => {
    const isHeading = row.querySelector('.is-heading')?.value === 'true';
    const keyInput = row.querySelector('.spec-key, '.repeat(2) + 'input[type="text"]');
    const valueInput = row.querySelector('.spec-value');
    
    if (isHeading && keyInput?.value.trim()) {
      // Add heading as a special object
      specs.push({
        type: 'heading',
        text: keyInput.value.trim()
      });
    } else if (!isHeading && keyInput?.value.trim() && valueInput?.value.trim()) {
      // Add regular key-value pair
      specs.push({
        type: 'spec',
        key: keyInput.value.trim(),
        value: valueInput.value.trim()
      });
    }
  });
  
  return specs.length > 0 ? specs : null;
}

// Load specifications into form
function loadSpecifications(specs) {
  const container = document.getElementById('specifications-container');
  if (!container || !specs) {
    addSpecificationField(); // Add one empty field if no specs
    return;
  }
  
  container.innerHTML = ''; // Clear existing fields
  
  if (Array.isArray(specs)) {
    // Handle new format with headings
    specs.forEach(item => {
      if (item.type === 'heading') {
        addSpecificationField(item.text, '', true);
      } else if (item.type === 'spec') {
        addSpecificationField(item.key, item.value);
      }
    });
  } else if (typeof specs === 'object' && specs !== null) {
    // Handle old format (backward compatibility)
    for (const [key, value] of Object.entries(specs)) {
      addSpecificationField(key, value);
    }
  }
  
  // Always ensure at least one empty field if no specs
  if ((Array.isArray(specs) && specs.length === 0) || 
      (typeof specs === 'object' && Object.keys(specs).length === 0)) {
    addSpecificationField();
  }
}

// Upload image to Supabase Storage
async function uploadImage(file) {
  try {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = fileName;

    // No need to check for bucket existence - assume it's pre-created
    // with public access in Supabase dashboard

    // 2. Upload the file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });

    if (uploadError) throw uploadError;

    // 3. Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error(`Image upload failed: ${error.message}`);
  }
}

// Update existing product
async function updateProduct(id, updates) {
  try {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    const { data, error } = await supabase
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw new Error(`Failed to update product: ${error.message}`);
  }
}

// Create new product
async function createProduct(productData) {
  try {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    const { data, error } = await supabase
      .from('products')
      .insert([{
        ...productData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select('*')
      .single();

    if (error) {
      console.error('Supabase create error:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw new Error(`Failed to create product: ${error.message}`);
  }
}

// Handle form submission
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const saveButton = document.getElementById('save-product');
  const originalButtonContent = saveButton.innerHTML;
  
  try {
    showLoadingState(true);
    // Disable the save button and show spinner
    saveButton.disabled = true;
    saveButton.innerHTML = `
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      <span class="sr-only">Saving...</span> Saving...
    `;
    
    // Get form values
    const name = document.getElementById('product-name').value.trim();
    const shortDescription = document.getElementById('product-short-description').value.trim();
    const description = document.getElementById('product-description').value.trim();
    const category = document.getElementById('product-category').value.trim();
    const originalPrice = parseFloat(document.getElementById('product-original-price').value) || 0;
    const salePrice = parseFloat(document.getElementById('product-sale-price').value) || null;
    const price = salePrice || originalPrice;
    const inStock = document.getElementById('product-in-stock').checked;
    
    const productData = {
      name,
      short_description: shortDescription,
      description: description,
      category: category || 'Uncategorized',
      price,
      original_price: originalPrice,
      sale_price: salePrice,
      in_stock: inStock,
      is_featured: document.getElementById('product-featured').checked,
      specifications: getSpecifications(),
      images: []
    };
    
    // Validate required fields
    if (!productData.name) {
      throw new Error('Product name is required');
    }
    if (!productData.category) {
      throw new Error('Category is required');
    }
    if (isNaN(productData.price) || productData.price <= 0) {
      throw new Error('Please enter a valid price');
    }
    
    // Upload images
    const uploadedImageUrls = [];
    for (let i = 0; i < currentImageFiles.length; i++) {
      if (currentImageFiles[i]) {
        try {
          const imageUrl = await uploadImage(currentImageFiles[i]);
          uploadedImageUrls.push(imageUrl);
        } catch (error) {
          console.error(`Error uploading image ${i + 1}:`, error);
          // Continue with other images even if one fails
        }
      } else if (currentImageUrls[i]) {
        // Keep existing image if no new one was uploaded
        uploadedImageUrls.push(currentImageUrls[i]);
      }
    }
    
    // If we have any images, set them in product data
    if (uploadedImageUrls.length > 0) {
      productData.images = uploadedImageUrls;
      productData.image_url = uploadedImageUrls[0]; // First image is the main one
    }
    
    // Convert price to number
    productData.price = parseFloat(productData.price) || 0;
    
    // Remove any empty strings
    Object.keys(productData).forEach(key => {
      if (productData[key] === '') {
        delete productData[key];
      }
    });
    
    // Update or create product
    let savedProduct;
    if (currentProductId) {
      savedProduct = await updateProduct(currentProductId, productData);
    } else {
      savedProduct = await createProduct(productData);
    }
    
    // Show success message
    showSuccess(currentProductId ? 'Product updated successfully!' : 'Product added successfully!');
    
    // If we're in edit mode, update the form with the saved data
    if (currentProductId) {
      // Keep the form open but update the data
      const updatedProduct = await getProductById(currentProductId);
      if (updatedProduct) {
        // Update the form with the latest data
        document.getElementById('product-name').value = updatedProduct.name || '';
        document.getElementById('product-short-description').value = updatedProduct.short_description || '';
        document.getElementById('product-description').value = updatedProduct.description || '';
        document.getElementById('product-category').value = updatedProduct.category || '';
        document.getElementById('product-original-price').value = updatedProduct.original_price || '';
        document.getElementById('product-sale-price').value = updatedProduct.sale_price || '';
        document.getElementById('product-in-stock').checked = updatedProduct.in_stock || false;
        
        // Update specifications
        if (updatedProduct.specifications) {
          loadSpecifications(updatedProduct.specifications);
        }
        
        // Update images
        if (updatedProduct.images && updatedProduct.images.length > 0) {
          currentImageUrls = [...updatedProduct.images, ...Array(4 - updatedProduct.images.length).fill('')];
          currentImageUrls.forEach((url, index) => {
            if (url) {
              updateImagePreview(url, updatedProduct.name, index);
            } else {
              const container = document.getElementById(`image-preview-${index}`);
              if (container) container.innerHTML = '';
            }
          });
        }
      }
    } else {
      // For new products, reset the form but stay on the form
      resetForm();
    }
    
  } catch (error) {
    console.error('Error saving product:', error);
    showError(error.message || 'Failed to save product. Please try again.');
  } finally {
    showLoadingState(false);
    // Restore the original button content and enable it
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.innerHTML = originalButtonContent;
    }
  }
}

// Get product by ID
async function getProductById(id) {
  console.log('Fetching product with ID:', id);
  
  try {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    console.log('Product fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in getProductById:', error);
    throw error;
  }
}

// Show/hide loading state
function showLoadingState(show) {
  const submitBtn = document.querySelector('button[type="submit"]');
  if (submitBtn) {
    if (show) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `      `;
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Save Product';
    }
  }
}

// Update image preview
function updateImagePreview(imageUrl, altText = '', index) {
  if (imageUrl) {
    const previewContainer = document.querySelector(`.image-preview-container[data-preview="${index + 1}"]`);
    if (previewContainer) {
      previewContainer.innerHTML = `
        <img src="${imageUrl}" 
             alt="${altText}" 
             class="img-fluid mt-2" 
             style="max-width: 200px; max-height: 200px; object-fit: cover;
                    border: 1px solid #dee2e6; border-radius: 4px;">
        <button type="button" class="btn btn-sm btn-outline-danger mt-2" onclick="window.removeImage()">
          <i class="far fa-trash-alt me-1"></i> Remove Image
        </button>
      `;
    }
  } else {
    const previewContainer = document.querySelector(`.image-preview-container[data-preview="${index + 1}"]`);
    if (previewContainer) {
      previewContainer.innerHTML = `
        <div class="text-center py-4 border rounded bg-light">
          <i class="far fa-image fa-3x text-muted mb-2"></i>
          <p class="mb-0 text-muted">No image selected</p>
        </div>
      `;
    }
  }
}

// Show/hide product form
function showProductForm(show) {
  if (show) {
    productsSection.classList.add('d-none');
    productFormSection.classList.remove('d-none');
  } else {
    productsSection.classList.remove('d-none');
    productFormSection.classList.add('d-none');
  }
}

// Show add product form
function showAddProductForm() {
  resetForm();
  document.getElementById('form-title').textContent = 'Add New Product';
  currentProductId = null;
  showProductForm(true);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show products list
function showProductsList() {
  productsSection.classList.remove('d-none');
  productFormSection.classList.add('d-none');
  resetForm();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Remove image
function removeImage(index, event) {
  if (event) event.stopPropagation();
  
  const imageInputs = document.querySelectorAll('.product-image');
  const previewContainers = document.querySelectorAll('.image-preview-container');
  
  if (index >= 0 && index < imageInputs.length) {
    imageInputs[index].value = '';
    previewContainers[index].innerHTML = '';
    currentImageFiles[index] = null;
    currentImageUrls[index] = '';
  }
}

// Edit product
async function editProduct(productId) {
  if (!productId) {
    console.error('No product ID provided');
    return;
  }
  
  try {
    showLoadingState(true);
    currentProductId = productId;
    
    const product = await getProductById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Populate form fields
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name || '';
    document.getElementById('product-short-description').value = product.short_description || '';
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-category').value = product.category || '';
    document.getElementById('product-original-price').value = product.original_price || '';
    document.getElementById('product-sale-price').value = product.sale_price || '';
    document.getElementById('product-in-stock').checked = product.in_stock !== false;
    
    // Load specifications if they exist
    if (product.specifications) {
      loadSpecifications(product.specifications);
    } else {
      loadSpecifications({});
    }
    
    // Handle images
    currentImageUrls = Array(4).fill('');
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach((img, index) => {
        if (index < 4) {
          currentImageUrls[index] = img;
          updateImagePreview(img, `Product Image ${index + 1}`, index);
        }
      });
    }
    
    // Update UI
    document.getElementById('form-title').textContent = 'Edit Product';
    showProductForm(true);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
  } catch (error) {
    console.error('Error editing product:', error);
    showError(error.message || 'Failed to load product details');
  } finally {
    showLoadingState(false);
  }
}

// Handle image upload
function handleImageUpload(e) {
  try {
    const file = e.target.files[0];
    const index = parseInt(e.target.dataset.index) - 1; // Convert to 0-based index
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.match('image.*')) {
      showError('Please select a valid image file');
      e.target.value = '';
      return;
    }
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showError('Image size should be less than 5MB');
      e.target.value = '';
      return;
    }
    
    // Update preview
    const reader = new FileReader();
    reader.onload = function(event) {
      const previewContainer = document.querySelector(`.image-preview-container[data-preview="${index + 1}"]`);
      if (previewContainer) {
        previewContainer.innerHTML = `
          <div class="position-relative d-inline-block">
            <img src="${event.target.result}" alt="Preview ${index + 1}" class="img-thumbnail" style="max-width: 150px; max-height: 150px;">
            <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle" 
                    onclick="removeImage(${index}, event)">
              <i class="fal fa-times"></i>
            </button>
          </div>
        `;
      }
    };
    
    reader.onerror = function() {
      showAlert('danger', 'Error reading the image file.');
    };
    
    reader.readAsDataURL(file);
    
    // Store the file for later upload
    currentImageFiles[index] = file;
    
  } catch (error) {
    console.error('Error handling image upload:', error);
    showAlert('danger', 'An error occurred while processing the image.');
  }
}

// Cancel edit and return to products list
function cancelEdit() {
  if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
    showProductsList();
  }
}

// Show error message
function showError(message) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-danger alert-dismissible fade show';
  alertDiv.role = 'alert';
  alertDiv.innerHTML = `
    <strong>Error:</strong> ${message}
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  `;
  
  // Insert alert at the top of the content
  const content = document.querySelector('.dashboard-page-content');
  if (content && content.firstChild) {
    content.insertBefore(alertDiv, content.firstChild);
    
    // Auto-remove alert after 5 seconds
    setTimeout(() => {
      if (alertDiv.parentNode === content) {
        content.removeChild(alertDiv);
      }
    }, 10000);
  } else {
    // Fallback to console if DOM manipulation fails
    console.error('Error:', message);
  }
}

// Show success message
function showSuccess(message) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-success alert-dismissible fade show';
  alertDiv.role = 'alert';
  alertDiv.innerHTML = `
    <strong>Success:</strong> ${message}
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  `;
  
  // Insert alert at the top of the content
  const content = document.querySelector('.dashboard-page-content');
  if (content && content.firstChild) {
    content.insertBefore(alertDiv, content.firstChild);
    
    // Auto-remove alert after 5 seconds
    setTimeout(() => {
      if (alertDiv.parentNode === content) {
        content.removeChild(alertDiv);
      }
    }, 5000);
  }
}

// Make functions available globally for inline event handlers
window.editProduct = editProduct;
window.removeImage = removeImage;
