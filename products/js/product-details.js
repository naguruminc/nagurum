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
    const galleryItems = images.map((img, index) => `
        <a class="list-group-item list-group-item-action p-0 d-flex mb-2 w-70px rounded-0 ${index === 0 ? 'active' : ''}" 
           data-index="${index}" 
           data-target="#gallery-${index + 1}">
            <img src="${img}" alt="Thumb ${index + 1}" class="img-cover" onerror="this.onerror=null;this.src='images/placeholder.jpg'">
        </a>`).join('');
    
    const galleryImages = images.map((img, index) => `
        <div class="gallery-item d-flex align-items-center justify-content-center mb-4" id="gallery-${index + 1}">
            <img src="${img}" alt="${product.name}" class="img-fluid max-h-100" onerror="this.onerror=null;this.src='images/placeholder.jpg'">
        </div>`).join('');

    // Create the product details HTML
    const productHtml = `
    <section class="pt-8 pb-lg-15 pb-11">
        <div class="container">
            <div class="row">
                <div class="col-md-6 mb-8 mb-md-0 position-relative">
                    <div class="d-flex">
                        <div id="list-dots" class="list-group product-image-dots dots-thumbs mr-2">
                            ${galleryItems}
                        </div>
                        <div class="scrollspy-images ml-md-12">
                            ${galleryImages}
                        </div>
                    </div>
                </div>
                <div class="col-md-6 pl-md-6 pl-lg-13 primary-summary summary-sticky" id="summary-sticky">
                    <div class="primary-summary-inner">
                        <p class="text-muted fs-11 font-weight-500 letter-spacing-05px text-uppercase mb-4">${product.category || 'Product'}</p>
                        <div class="d-flex align-items-center">
                            <h1 class="fs-30 mb-1">${product.name}</h1>
                            ${product.in_stock ? '' : '<span class="badge badge-danger rounded-pill ml-6">Out of Stock</span>'}
                        </div>
                        <div class="price-container" style="margin: 12px 0;">
                            <span style="color: #e74c3c !important; margin-right: 8px !important; font-size: 1.5rem; font-weight: 600;">₹${parseFloat(displayPrice).toFixed(2)}</span>
                            ${salePrice ? `
                                <span style="text-decoration: line-through !important; margin-right: 8px !important; color: #95a5a6;">₹${parseFloat(originalPrice).toFixed(2)}</span>
                                <span style="background-color: #e74c3c !important; font-weight: 600 !important; color: white !important; padding: 1px 6px !important; border-radius: 10px !important; display: inline-block !important; font-size: 0.7rem !important; line-height: 1.2 !important;">
                                    ${Math.round(((originalPrice - salePrice) / originalPrice) * 100)}% OFF
                                </span>
                            ` : ''}
                        </div>
                        ${product.short_description ? 
                            `<div class="product-short-description mb-4">${product.short_description}</div>` : 
                            product.description ? 
                            `<div class="product-description mb-4">${product.description}</div>` : 
                            ''
                        }
                        <form>
                            <div class="row align-items-end no-gutters mx-n2">
                                <div class="col-sm-12 mb-6 px-2">
                                    <a href="https://wa.me/+919176055555?text=I%20Want%20To%20Order%20${encodeURIComponent(product.name)}" 
                                       class="btn btn-success btn-block text-capitalize mb-3" 
                                       target="_blank">
                                        <i class="fab fa-whatsapp mr-2"></i> Order On WhatsApp
                                    </a>
                                    <a href="tel:+919176055555" class="btn btn-primary btn-block text-capitalize">
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
    const thumbnails = document.querySelectorAll('.product-image-dots .list-group-item');
    const scrollContainer = document.querySelector('.scrollspy-images');
    const images = document.querySelectorAll('.scrollspy-images a');
    const summarySticky = document.querySelector('.summary-sticky');
    
    // Set initial heights and sync scrolling
    function syncHeights() {
        try {
            const galleryContainer = document.querySelector('.product-gallery-container');
            
            // Check if elements exist before accessing their properties
            if (!galleryContainer || !scrollContainer || !summarySticky) {
                console.warn('One or more required elements are missing');
                return;
            }
            
            const galleryHeight = galleryContainer.offsetHeight;
            const summaryHeight = summarySticky.offsetHeight;
            
            // Only proceed if we have valid heights
            if (galleryHeight > 0 && summaryHeight > 0) {
                const maxHeight = Math.max(galleryHeight, summaryHeight);
                
                // Set both containers to the same height
                scrollContainer.style.height = `${maxHeight}px`;
                summarySticky.style.height = `${maxHeight}px`;
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
    
    // Handle thumbnail clicks
    thumbnails.forEach((item) => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active thumbnail
            thumbnails.forEach(thumb => thumb.classList.remove('active'));
            this.classList.add('active');
            
            // Get the target image index
            const targetIndex = parseInt(this.getAttribute('data-index'));
            const targetId = this.getAttribute('data-target');
            const targetImage = document.querySelector(targetId);
            
            if (targetImage) {
                // Hide all images first
                document.querySelectorAll('.gallery-item').forEach(img => {
                    img.style.display = 'none';
                });
                
                // Show the selected image
                targetImage.style.display = 'flex';
                
                // Update URL hash
                window.location.hash = targetId;
                
                // Scroll to the top of the container
                scrollContainer.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Variables for scroll syncing
    let isSyncingScroll = false;
    let lastScrollTime = Date.now();
    
    // Sync scrolling between content and images
    function syncScroll(scrollSource, scrollTarget) {
        try {
            if (!scrollSource || !scrollTarget || isSyncingScroll) return;
            
            const currentTime = Date.now();
            if (currentTime - lastScrollTime < 50) return; // Throttle to ~20fps
            
            isSyncingScroll = true;
            
            // Calculate scroll percentage
            const scrollHeight = scrollSource.scrollHeight - scrollSource.clientHeight;
            if (scrollHeight <= 0) {
                isSyncingScroll = false;
                return;
            }
            
            const scrollPercentage = scrollSource.scrollTop / scrollHeight;
            
            // Apply the same scroll percentage to the target
            const targetScrollHeight = scrollTarget.scrollHeight - scrollTarget.clientHeight;
            if (targetScrollHeight > 0) {
                scrollTarget.scrollTop = scrollPercentage * targetScrollHeight;
            }
            
            lastScrollTime = currentTime;
            
            // Update active thumbnail if we have a valid scroll container
            if (scrollSource === scrollContainer) {
                updateActiveThumbnail();
            }
            
            // Reset sync lock
            requestAnimationFrame(() => {
                isSyncingScroll = false;
            });
        } catch (error) {
            console.error('Error in scroll sync:', error);
            isSyncingScroll = false;
        }
    }
    
    // Set up scroll event listeners for both containers
    scrollContainer.addEventListener('scroll', () => {
        syncScroll(scrollContainer, summarySticky);
    });
    
    summarySticky.addEventListener('scroll', () => {
        syncScroll(summarySticky, scrollContainer);
    });
    
    // Update active thumbnail based on scroll position
    function updateActiveThumbnail() {
        const containerRect = scrollContainer.getBoundingClientRect();
        const containerCenter = containerRect.top + (containerRect.height / 2);
        
        let closestImage = null;
        let minDistance = Infinity;
        
        images.forEach((img, index) => {
            const imgRect = img.getBoundingClientRect();
            const imgCenter = imgRect.top + (imgRect.height / 2);
            const distance = Math.abs(containerCenter - imgCenter);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestImage = index;
            }
        });
        
        if (closestImage !== null) {
            thumbnails.forEach((thumb, index) => {
                if (index === closestImage) {
                    thumb.classList.add('active');
                    // Ensure the active thumbnail is visible in the container
                    thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                } else {
                    thumb.classList.remove('active');
                }
            });
        }
    }
    
    // Initialize with the first thumbnail active
    if (thumbnails.length > 0) {
        thumbnails[0].classList.add('active');
    }
    
    // Initialize Magnific Popup for image zoom
    $('.scrollspy-images a').magnificPopup({
        type: 'image',
        gallery: {
            enabled: true
        },
        zoom: {
            enabled: true,
            duration: 300,
            easing: 'ease-in-out',
            opener: function(openerElement) {
                return openerElement.is('img') ? openerElement : openerElement.find('img');
            }
        },
        callbacks: {
            open: function() {
                // Pause scroll event handling while popup is open
                isScrolling = true;
            },
            close: function() {
                // Resume scroll event handling
                setTimeout(() => {
                    isScrolling = false;
                    updateActiveThumbnail();
                }, 100);
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
