// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Get the product ID from the URL
    const urlParams = new URLSearchParams(window.location.search);
    let productId = urlParams.get('id');

    console.log('URL Parameters:', Object.fromEntries(urlParams.entries()));
    
    if (!productId) {
        showError('Product ID is missing in the URL');
        return;
    }
    
    // Convert productId to number if it's a numeric string
    productId = isNaN(productId) ? productId : Number(productId);
    console.log('Product ID after processing:', productId, 'Type:', typeof productId);

    // Show loading state
    const mainContent = document.querySelector('main');
    mainContent.innerHTML = `
        <div class="container py-10">
            <div class="row justify-content-center">
                <div class="col-12 text-center py-10">
                    <div class="spinner-border text-primary" role="status">
                        <span class="sr-only">Loading...</span>
                    </div>
                    <p class="mt-3">Loading product details...</p>
                </div>
            </div>
        </div>`;

    try {
        console.log('Fetching product with ID:', productId);
        
        // Check if supabase is properly initialized
        if (!window.supabase) {
            throw new Error('Supabase client is not properly initialized');
        }

        // Fetch product details from Supabase
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        console.log('Supabase response:', { product, error });

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }
        
        if (!product) {
            throw new Error(`Product with ID ${productId} not found`);
        }

        // Render the product details
        renderProductDetails(product);
        
        // Initialize tab functionality
        if (typeof $ !== 'undefined') {
            $('#productTabs a').on('click', function (e) {
                e.preventDefault();
                $(this).tab('show');
            });
        }
    } catch (error) {
        console.error('Error loading product:', error);
        showError(`Failed to load product details: ${error.message || 'Unknown error'}`);
    }
});

function renderProductDetails(product) {
    // Get the main content container
    const mainContent = document.querySelector('main');
    
    // Format price
    const originalPrice = product.original_price || product.price;
    const salePrice = product.sale_price || null;
    const displayPrice = salePrice || originalPrice;
    
    // Create image gallery HTML
    const images = product.images && product.images.length > 0 ? product.images : [product.image_url || 'images/placeholder.jpg'];
    
    // Main image (first image by default)
    const mainImage = images[0];
    
    // Thumbnail navigation
    const thumbnailItems = images.map((img, index) => `
        <div class="thumbnail-item ${index === 0 ? 'active' : ''}" 
             data-index="${index}" 
             data-src="${img}">
            <img src="${img}" 
                 alt="Thumb ${index + 1}" 
                 onerror="this.onerror=null;this.src='images/placeholder.jpg'">
        </div>`).join('');

    // Create the product details HTML
    const productHtml = `
    <section class="py-4">
        <div class="container">
            <div class="row align-items-start">
                <!-- Product Gallery -->
                <div class="col-md-6 mb-4 mb-md-0 product-gallery-container">
                    <div class="main-image-container">
                        <img src="${mainImage}" 
                             alt="${product.name}" 
                             class="main-image" 
                             onerror="this.onerror=null;this.src='images/placeholder.jpg'">
                    </div>
                    <div class="thumbnail-navigation">
                        ${thumbnailItems}
                    </div>
                </div>
                
                <!-- Product Summary -->
                <div class="col-md-6 pl-md-4 pl-lg-5 primary-summary summary-sticky" id="summary-sticky">
                    <div class="primary-summary-inner">
                        <!-- Category -->
                        <p class="text-muted fs-11 font-weight-500 letter-spacing-05px text-uppercase mb-2">
                            ${product.category || 'Product'}
                        </p>
                        
                        <!-- Product Name -->
                        <div class="d-flex align-items-center mb-2">
                            <h1 class="fs-28 mb-0">${product.name}</h1>
                            ${product.in_stock ? '' : '<span class="badge badge-danger rounded-pill ml-3">Out of Stock</span>'}
                        </div>
                        
                        <!-- Price -->
                        <div class="price-container mb-3">
                            <div class="d-flex align-items-center">
                                <span class="text-danger font-weight-bold mr-2" style="font-size: 1.4rem;">
                                    ₹${parseFloat(displayPrice).toFixed(2)}
                                </span>
                                ${salePrice ? `
                                    <span class="text-muted text-decoration-line-through mr-2">
                                        ₹${parseFloat(originalPrice).toFixed(2)}
                                    </span>
                                    <span class="badge bg-danger text-white font-weight-normal">
                                        ${Math.round(((originalPrice - salePrice) / originalPrice) * 100)}% OFF
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                        ${product.short_description ? 
                            `<div class="product-short-description mb-4">${product.short_description}</div>` : 
                            product.description ? 
                            `<div class="product-description mb-5">${product.description}</div>` : 
                            ''
                        }
                        <form>
                            <div class="row align-items-end no-gutters mx-n2">
                                <div class="col-sm-12 mb-6 px-2">
                                    <a href="https://wa.me/+919176655555?text=I%20Want%20To%20Order%20${encodeURIComponent(product.name)}" 
                                       class="btn btn-success btn-block text-capitalize mb-3" 
                                       target="_blank">
                                        <i class="fab fa-whatsapp mr-2"></i> Order On WhatsApp
                                    </a>
                                    <a href="tel:+919176655555" class="btn btn-primary btn-block text-capitalize">
                                        <i class="fas fa-phone-alt mr-2"></i> Contact Store
                                    </a>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </section>`;

    // Create specifications HTML if they exist
    let specsHtml = '';
    if (product.specifications && (Array.isArray(product.specifications) ? product.specifications.length > 0 : Object.keys(product.specifications).length > 0)) {
        specsHtml = `
            <div class="specifications-container">
                <h3 class="mb-4">Product Specifications</h3>`;
                
        // Handle both array (new format) and object (old format) specifications
        if (Array.isArray(product.specifications)) {
            let currentTable = '';
            let isTableOpen = false;
            
            product.specifications.forEach((item, index) => {
                if (item.type === 'heading') {
                    // Close previous table if open
                    if (isTableOpen) {
                        specsHtml += `
                            </tbody>
                        </table>
                    </div>`;
                        isTableOpen = false;
                    }
                    
                    // Add heading
                    if (index > 0) specsHtml += '<div class="mt-5"></div>'; // Add spacing between sections
                    specsHtml += `
                    <h4 class="spec-heading mt-4 mb-3 pb-2 border-bottom">${item.text}</h4>
                    <div class="specifications-table">
                        <table class="table table-bordered">
                            <tbody>`;
                    isTableOpen = true;
                } else if (item.type === 'spec') {
                    // Add specification row
                    if (!isTableOpen) {
                        specsHtml += `
                    <div class="specifications-table">
                        <table class="table table-bordered">
                            <tbody>`;
                        isTableOpen = true;
                    }
                    
                    specsHtml += `
                                <tr>
                                    <th style="width: 30%;">${item.key}</th>
                                    <td>${item.value}</td>
                                </tr>`;
                }
            });
            
            // Close the last table if still open
            if (isTableOpen) {
                specsHtml += `
                            </tbody>
                        </table>
                    </div>`;
            }
        } else {
            // Old format (backward compatibility)
            specsHtml += `
                <div class="specifications-table">
                    <table class="table table-bordered">
                        <tbody>`;
            
            for (const [key, value] of Object.entries(product.specifications)) {
                if (value) {  // Only add if value exists
                    specsHtml += `
                        <tr>
                            <th style="width: 30%;">${key}</th>
                            <td>${value}</td>
                        </tr>`;
                }
            }
            
            specsHtml += `
                        </tbody>
                    </table>
                </div>`;
        }
        
        specsHtml += `
            </div>`;
    } else {
        specsHtml = '<p>No specifications available for this product.</p>';
    }

    // Add tabs content to the product HTML
    const tabsHtml = `
    <!-- Product Tabs -->
    <div class="row mt-8">
        <div class="col-12">
            <div class="product-tabs">
                <ul class="nav nav-tabs border-0 mb-6" id="productTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="description-tab" data-toggle="tab" data-target="#description" type="button" role="tab" aria-controls="description" aria-selected="true">Description</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="specifications-tab" data-toggle="tab" data-target="#specifications" type="button" role="tab" aria-controls="specifications" aria-selected="false">Specifications</button>
                    </li>
                </ul>
                <div class="tab-content pt-4" id="productTabsContent">
                    <div class="tab-pane fade show active" id="description" role="tabpanel" aria-labelledby="description-tab">
                        <div id="product-description">
                            ${product.detailed_description || product.description || '<p>No detailed description available for this product.</p>'}
                        </div>
                    </div>
                    <div class="tab-pane fade" id="specifications" role="tabpanel" aria-labelledby="specifications-tab">
                        <div id="product-specifications">
                            ${specsHtml}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    // Update the main content with product details and tabs
    mainContent.innerHTML = productHtml + tabsHtml;

    // Initialize image gallery
    initImageGallery();
}

function initImageGallery() {
    const thumbnails = document.querySelectorAll('.thumbnail-item');
    const mainImage = document.querySelector('.main-image');
    const summarySticky = document.querySelector('.summary-sticky');
    
    // Handle thumbnail clicks
    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', function() {
            const imgSrc = this.getAttribute('data-src');
            if (imgSrc) {
                // Update main image with fade effect
                mainImage.style.opacity = '0';
                setTimeout(() => {
                    mainImage.src = imgSrc;
                    mainImage.style.opacity = '1';
                }, 150);
                
                // Update active thumbnail
                thumbnails.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Scroll thumbnail into view if needed
                this.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }
        });
    });
    
    // Set initial heights
    function syncHeights() {
        try {
            const galleryContainer = document.querySelector('.product-gallery-container');
            
            // Check if elements exist before accessing their properties
            if (!galleryContainer || !summarySticky) {
                console.warn('One or more required elements are missing');
                return;
            }
            
            const galleryHeight = galleryContainer.offsetHeight;
            const summaryHeight = summarySticky.offsetHeight;
            
            // Only proceed if we have valid heights
            if (galleryHeight > 0 && summaryHeight > 0) {
                const maxHeight = Math.max(galleryHeight, summaryHeight);
                
                // Set summary container to the max height
                summarySticky.style.height = `${maxHeight}px`;
                
                // Set main image container height
                const mainImageContainer = document.querySelector('.main-image-container');
                if (mainImageContainer) {
                    mainImageContainer.style.height = `calc(100% - 100px)`; // Account for thumbnails
                }
            } else {
                // If heights are 0, try again after a short delay
                setTimeout(syncHeights, 100);
            }
        } catch (error) {
            console.error('Error syncing heights:', error);
        }
    }
    
    // Call initially and on window resize
    syncHeights();
    window.addEventListener('resize', syncHeights);
    
    // Initialize Magnific Popup for image zoom on the main image
    $('.main-image-container').magnificPopup({
        type: 'image',
        items: {
            src: mainImage.src
        },
        zoom: {
            enabled: true,
            duration: 300,
            easing: 'ease-in-out',
            opener: function(openerElement) {
                return $(openerElement).find('img');
            }
        },
        callbacks: {
            open: function() {
                // Pause any animations while popup is open
            },
            close: function() {
                // Resume animations
            }
        }
    });
    
    // Update Magnific Popup when changing images
    document.addEventListener('click', function(e) {
        if (e.target.closest('.thumbnail-item')) {
            const newSrc = e.target.closest('.thumbnail-item').getAttribute('data-src');
            const magnificPopup = $.magnificPopup.instance;
            
            if (magnificPopup.isOpen) {
                magnificPopup.close();
                setTimeout(() => {
                    $('.main-image-container').magnificPopup('open', {
                        items: {
                            src: newSrc
                        }
                    });
                }, 300);
            }
        }
    });
}

function showError(message) {
    const mainContent = document.querySelector('main');
    mainContent.innerHTML = `
        <div class="container py-10">
            <div class="row justify-content-center">
                <div class="col-12 text-center py-10">
                    <div class="alert alert-danger" role="alert">
                        <i class="fas fa-exclamation-circle mr-2"></i> ${message}
                    </div>
                    <a href="pro.html" class="btn btn-primary mt-3">Back to Products</a>
                </div>
            </div>
        </div>`;
}
