// Get supabase from global scope
const supabase = window.supabase;

// Wait for everything to be loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Check if supabase is initialized
    if (!supabase) {
        console.error('Supabase not initialized');
        const productsContainer = document.querySelector('.products-container');
        if (productsContainer) {
            productsContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-danger">Error: Failed to initialize the application. Please refresh the page.</p>
                </div>`;
        }
        return;
    }
    // Find the products container in the HTML
    const productsContainer = document.querySelector('.products-container');
    
    if (!productsContainer) {
        console.error('Products container not found in the HTML');
        return;
    }

    try {
        // Show loading state
        productsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                </div>
                <p class="mt-2">Loading products...</p>
            </div>
        `;

        // Fetch products from Supabase
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!products || products.length === 0) {
            productsContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted">No products available at the moment. Please check back later.</p>
                </div>
            `;
            return;
        }

        // Clear the loading state
        productsContainer.innerHTML = '';

        // Check if we're on the index page (limit to 5 products) or products page (show all)
        const isIndexPage = window.location.pathname.endsWith('index.html') || 
                          window.location.pathname.endsWith('/') ||
                          window.location.pathname === '';
        
        // Limit to 5 products only on index page
        const productsToShow = isIndexPage ? products.slice(0, 5) : products;
        
        // Generate product cards
        productsToShow.forEach(product => {
            const productCard = createProductCard(product);
            productCard.classList.add('col-6', 'col-sm-4', 'col-md-3', 'col-lg-2-4', 'mb-8');
            productsContainer.appendChild(productCard);
        });

        // Initialize product hover effects and quick view functionality
        initProductHoverEffects();
        
        // Add click handlers for quick view buttons
        document.querySelectorAll('.quick-view').forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const productId = this.getAttribute('data-id');
                showQuickView(productId);
                return false;
            });
        });
    } catch (error) {
        console.error('Error loading products:', error);
        productsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <p class="text-danger">Failed to load products. Please try again later.</p>
                <p class="text-muted small">${error.message}</p>
            </div>
        `;
    }
});

// Create a product card element
function createProductCard(product) {
        // Get image URL with fallback
    const getImageUrl = (imageUrl) => {
        return imageUrl || 'images/placeholder.jpg';
    };
    
    // Get main and secondary images with fallbacks
    const getMainImage = () => {
        // If we have images array and it's not empty, use the first image
        if (product.images && product.images.length > 0) {
            return getImageUrl(product.images[0]);
        }
        // Fallback to image_url if no images array
        return getImageUrl(product.image_url);
    };
    
    const getSecondaryImage = () => {
        // If we have at least 2 images, use the second one for hover
        if (product.images && product.images.length > 1) {
            return getImageUrl(product.images[1]);
        }
        // If only one image is available, use the same image but with a slight zoom effect
        return getMainImage();
    };
    
    const mainImage = getMainImage();
    const secondaryImage = getSecondaryImage();
    
    // Add error handler for images
    const handleImageError = (img) => {
        if (!img.src.endsWith('images/placeholder.jpg')) {
            img.src = 'images/placeholder.jpg';
            img.onerror = null; // Prevent infinite loop if placeholder also fails
        }
    };
    
    // Format prices
    const originalPrice = product.original_price || product.price;
    const salePrice = product.sale_price || null;
    const displayPrice = salePrice || originalPrice;
    
    // Create the product card HTML
    const productCard = document.createElement('div');
    productCard.className = 'col-6 col-md-4 col-lg-2-4 product mb-8';
    productCard.innerHTML = `
        <div class="card border-0" style="height: 400px; border-radius: 0 !important; display: flex; flex-direction: column;">
            <div class="position-relative hover-zoom-in" style="flex: 0 0 70%; border-radius: 0 !important; background: #f8f9fa;">
                <a href="../products/products-details.html?id=${product.id}" class="d-block position-relative overflow-hidden h-100" style="border-radius: 0 !important; display: block; height: 100%;">
                    <img src="${mainImage}" alt="${product.name}" class="image-active" onerror="this.onerror=null;this.src='images/placeholder.jpg'">
                    <img src="${secondaryImage}" alt="${product.name}" class="image-hover" onerror="this.onerror=null;this.src='images/placeholder.jpg'">
                </a>
                <div class="position-absolute pos-fixed-top-right d-inline-flex p-4 flex-column z-index-10">
                    <div class="d-flex align-items-center">
                    </div>
                </div>
            </div>
            <div class="card-body px-0 pt-3 pb-2" style="flex: 1; display: flex; flex-direction: column;">
                <div class="product-content" style="flex: 1; min-height: 0;">
                    <h3 class="fs-16 mb-2" style="line-height: 1.4;">
                        <a href="../products/products-details.html?id=${product.id}" class="text-heading font-weight-600 text-truncate-2 d-block" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${product.name}</a>
                    </h3>
                    <div class="d-flex align-items-center mt-2" style="display: flex !important; align-items: center !important; margin: 10px 0 !important;">
                        <span style="color: #e74c3c !important; font-weight: 600 !important; margin-right: 8px !important;">₹${parseFloat(displayPrice).toFixed(2)}</span>
                        ${salePrice ? `
                            <span style="text-decoration: line-through !important; color: #95a5a6 !important;">₹${parseFloat(originalPrice).toFixed(2)}</span>
                        ` : ''}
                    </div>
                </div>
                ${!product.in_stock ? `
                    <div class="mt-3">
                        <span class="badge badge-danger">Out of Stock</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    return productCard;
}

// Initialize product hover effects
function initProductHoverEffects() {
    // Add hover effect for product images
    const productItems = document.querySelectorAll('.product');
    
    productItems.forEach(item => {
        const imageActive = item.querySelector('.image-active');
        const imageHover = item.querySelector('.image-hover');
        
        if (imageActive && imageHover) {
            item.addEventListener('mouseenter', () => {
                imageActive.style.opacity = '0';
                imageHover.style.opacity = '1';
            });
            
            item.addEventListener('mouseleave', () => {
                imageActive.style.opacity = '1';
                imageHover.style.opacity = '0';
            });
        }
    });

    // Handle quick view modal
    async function showQuickView(productId) {
        try {
            // Show loading state
            const modalBody = document.querySelector('#quickViewModal .modal-body');
            if (modalBody) {
                modalBody.innerHTML = `
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="sr-only">Loading...</span>
                        </div>
                        <p class="mt-2">Loading product details...</p>
                    </div>
                `;
            }

            // Fetch product details
            const { data: product, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();

            if (error) throw error;
            if (!product) throw new Error('Product not found');

            // Format price
            const price = product.price ? parseFloat(product.price).toFixed(2) : '0.00';
            const originalPrice = product.originalPrice ? parseFloat(product.originalPrice).toFixed(2) : null;
            
            // Get main image
            const mainImage = product.images && product.images.length > 0 ? 
                product.images[0] : product.image_url || 'images/placeholder.jpg';

            // Create quick view content
            const quickViewContent = `
                <div class="row">
                    <div class="col-md-6">
                        <div class="position-relative">
                            <img src="${mainImage}" alt="${product.name}" class="img-fluid w-100" 
                                 style="max-height: 400px; object-fit: contain;">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h3 class="h4 mb-2">${product.name}</h3>
                        <div class="d-flex align-items-center mb-3">
                            <span class="h5 font-weight-bold text-primary mr-3">₹${price}</span>
                            ${originalPrice ? 
                                `<span class="text-muted text-decoration-line-through">₹${originalPrice}</span>` 
                                : ''
                            }
                        </div>
                        <div class="mb-4">
                            ${product.description || 'No description available.'}
                        </div>
                        <div class="d-flex align-items-center mb-4">
                            <div class="input-group quantity mr-3" style="width: 140px;">
                                <div class="input-group-btn">
                                    <button class="btn btn-sm btn-outline-secondary btn-minus">
                                        <i class="fa fa-minus"></i>
                                    </button>
                                </div>
                                <input type="text" class="form-control form-control-sm text-center border-secondary" value="1">
                                <div class="input-group-btn">
                                    <button class="btn btn-sm btn-outline-secondary btn-plus">
                                        <i class="fa fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                            <button class="btn btn-primary px-4 add-to-cart" data-id="${product.id}"
                                    ${!product.in_stock ? 'disabled' : ''}>
                                <i class="fa fa-shopping-cart mr-2"></i>
                                ${product.in_stock ? 'Add To Cart' : 'Out of Stock'}
                            </button>
                        </div>
                        <div class="d-flex pt-2">
                            <a href="product-detail.html?id=${product.id}" class="btn btn-outline-dark btn-sm mr-2">
                                <i class="fas fa-info-circle mr-1"></i> View Details
                            </a>
                        </div>
                    </div>
                </div>
            `;

            // Update modal content
            if (modalBody) {
                modalBody.innerHTML = quickViewContent;
                
                // Initialize quantity controls
                const quantityInput = modalBody.querySelector('input');
                const minusBtn = modalBody.querySelector('.btn-minus');
                const plusBtn = modalBody.querySelector('.btn-plus');
                
                if (minusBtn && plusBtn && quantityInput) {
                    minusBtn.addEventListener('click', () => {
                        let value = parseInt(quantityInput.value);
                        if (value > 1) {
                            quantityInput.value = value - 1;
                        }
                    });
                    
                    plusBtn.addEventListener('click', () => {
                        let value = parseInt(quantityInput.value);
                        quantityInput.value = value + 1;
                    });
                }
                
                // Handle add to cart
                const addToCartBtn = modalBody.querySelector('.add-to-cart');
                if (addToCartBtn) {
                    addToCartBtn.addEventListener('click', () => {
                        const quantity = parseInt(quantityInput?.value) || 1;
                        // You can implement add to cart functionality here
                        console.log(`Added ${quantity} of product ${product.id} to cart`);
                        // Show success message
                        const toast = document.createElement('div');
                        toast.className = 'alert alert-success alert-dismissible fade show position-fixed';
                        toast.style.bottom = '20px';
                        toast.style.right = '20px';
                        toast.style.zIndex = '9999';
                        toast.style.minWidth = '300px';
                        toast.role = 'alert';
                        toast.innerHTML = `
                            <strong>Success!</strong> Added to your cart.
                            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        `;
                        document.body.appendChild(toast);
                        
                        // Auto-remove after 3 seconds
                        setTimeout(() => {
                            toast.classList.remove('show');
                            setTimeout(() => toast.remove(), 150);
                        }, 3000);
                    });
                }
            }

            // Initialize and show the modal
            const modalElement = document.getElementById('quickViewModal');
            if (modalElement) {
                // Check if Bootstrap is available
                if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                    const modal = new bootstrap.Modal(modalElement);
                    modal.show();
                } else {
                    // Fallback to jQuery if available
                    if (typeof $ !== 'undefined' && $.fn.modal) {
                        $(modalElement).modal('show');
                    } else {
                        // Last resort - show the modal directly
                        modalElement.style.display = 'block';
                        modalElement.classList.add('show');
                        document.body.classList.add('modal-open');
                        const backdrop = document.createElement('div');
                        backdrop.className = 'modal-backdrop fade show';
                        document.body.appendChild(backdrop);
                    }
                }
            }
            
        } catch (error) {
            console.error('Error loading quick view:', error);
            const modalBody = document.querySelector('#quickViewModal .modal-body');
            if (modalBody) {
                modalBody.innerHTML = `
                    <div class="alert alert-danger">
                        <h5>Error</h5>
                        <p>Failed to load product details. Please try again later.</p>
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                    </div>
                `;
            }
        }
    }

    // Add click handlers for view product and quick view
    function handleDocumentClick(e) {
        // Handle quick view button clicks
        const quickViewBtn = e.target.closest('.quick-view');
        if (quickViewBtn) {
            e.preventDefault();
            e.stopPropagation();
            const productId = quickViewBtn.getAttribute('data-id');
            showQuickView(productId);
            return false;
        }
        
        // Handle view product link clicks
        const viewProductLink = e.target.closest('.view-product');
        if (viewProductLink && !e.target.closest('.quick-view')) {
            e.preventDefault();
            const productId = viewProductLink.getAttribute('data-id');
            window.location.href = `product-detail.html?id=${productId}`;
            return false;
        }
    }
    
    // Add event listener for click events
    document.addEventListener('click', handleDocumentClick);
    
    // Close modal when clicking on the close button or outside the modal
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('quickViewModal');
        if (!modal) return;
        
        const closeBtn = e.target.closest('.close, [data-dismiss="modal"]');
        if (closeBtn && modal.contains(closeBtn)) {
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) bsModal.hide();
            } else if (typeof $ !== 'undefined' && $.fn.modal) {
                $(modal).modal('hide');
            } else {
                modal.style.display = 'none';
                modal.classList.remove('show');
                document.body.classList.remove('modal-open');
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) backdrop.remove();
            }
            return false;
        }
        
        // Close when clicking outside the modal content
        if (e.target === modal) {
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) bsModal.hide();
            } else if (typeof $ !== 'undefined' && $.fn.modal) {
                $(modal).modal('hide');
            } else {
                modal.style.display = 'none';
                modal.classList.remove('show');
                document.body.classList.remove('modal-open');
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) backdrop.remove();
            }
        }
    });

    document.querySelectorAll('.add-to-wishlist').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.getAttribute('data-id');
            // You can implement add to wishlist functionality here
            console.log('Add to wishlist:', productId);
        });
    });
}

// Add optimized styles for the product images
const style = document.createElement('style');
style.textContent = `
    .hover-zoom-in {
        position: relative;
        overflow: hidden;
        background: #f8f9fa; /* Match this with your background color */
    }
    .hover-zoom-in .image-active,
    .hover-zoom-in .image-hover {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        backface-visibility: hidden;
        will-change: transform, opacity;
        transform: translateZ(0); /* Force hardware acceleration */
    }
    .hover-zoom-in .image-active {
        opacity: 1;
        transform: scale(1);
        transition: opacity 0.4s ease-out, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 1;
    }
    .hover-zoom-in .image-hover {
        opacity: 0;
        transform: scale(1.05);
        transition: opacity 0.4s ease-out 0.1s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 2;
    }
    .hover-zoom-in:hover .image-active {
        opacity: 0;
        transform: scale(1.02);
    }
    .hover-zoom-in:hover .image-hover {
        opacity: 1;
        transform: scale(1.05);
    }
    /* Add a subtle overlay on hover for better visibility */
    .hover-zoom-in::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.03);
        z-index: 3;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
    }
    .hover-zoom-in:hover::before {
        opacity: 1;
    }
    .pos-fixed-top-right {
        position: absolute;
        top: 0;
        right: 0;
    }
    
    .pos-fixed-bottom {
        position: absolute;
        bottom: 0;
        left: 0;
    }
    
    .z-index-10 {
        z-index: 10;
    }
    
    .content-change-horizontal {
        transform: translateY(100%);
        transition: transform 0.3s ease;
    }
    
    .product:hover .content-change-horizontal {
        transform: translateY(0);
    }
    
    .btn-hover-zoom {
        transition: all 0.3s ease;
    }
    
    .btn-hover-zoom:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
`;
document.head.appendChild(style);
