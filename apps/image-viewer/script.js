document.addEventListener('DOMContentLoaded', function() {
    const imageDisplay = document.getElementById('image-display');
    const imageContainer = document.getElementById('image-container');
    const imageInfo = document.getElementById('image-info');
    const zoomLevel = document.getElementById('zoom-level');
    
    // Cache button elements
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const zoomInButton = document.getElementById('zoom-in-button');
    const zoomOutButton = document.getElementById('zoom-out-button');
    const rotateButton = document.getElementById('rotate-button');
    
    // Prevent selection and highlighting throughout the app
    document.addEventListener('mousedown', function(e) {
        if (!e.target.classList.contains('toolbar-button')) {
            e.preventDefault();
        }
    });
    
    // Prevent drag start for all elements
    document.addEventListener('dragstart', e => e.preventDefault());
    
    // Add tooltip functionality
    setupTooltips();
    
    // State variables
    let currentZoom = 0.825; // 82.5%
    let currentRotation = 0;
    let imageName = '';
    let imagesArray = [];
    let currentImageIndex = 0;
    let isWindowMaximized = false;
    let initialImageLoaded = false;
    let displayScaleFactor = 100 / 82.5;
    let isLoadingImage = false; // Flag to prevent multiple simultaneous loads
    
    // Setup tooltips for toolbar buttons with single tooltip instance
    let activeTooltip = null;
    
    function setupTooltips() {
        const buttons = document.querySelectorAll('.toolbar-button');
        
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => showTooltip(button));
            button.addEventListener('mouseleave', () => hideTooltip());
        });
    }
    
    function showTooltip(element) {
        hideTooltip();
        
        const tooltipText = element.getAttribute('data-tooltip');
        if (!tooltipText) return;
        
        const tooltip = document.createElement('div');
        tooltip.className = 'viewer-tooltip';
        tooltip.textContent = tooltipText;
        document.body.appendChild(tooltip);
        activeTooltip = tooltip;
        
        const rect = element.getBoundingClientRect();
        
        let left = rect.left + rect.width/2 - tooltip.offsetWidth/2;
        let top = rect.top - tooltip.offsetHeight - 5;
        
        if (left < 5) left = 5;
        if (left + tooltip.offsetWidth > window.innerWidth - 5) {
            left = window.innerWidth - tooltip.offsetWidth - 5;
        }
        if (top < 5) {
            top = rect.bottom + 5;
        }
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
    }
    
    function hideTooltip() {
        if (activeTooltip) {
            activeTooltip.parentNode.removeChild(activeTooltip);
            activeTooltip = null;
        }
    }

    // Listen for messages from parent window
    window.addEventListener('message', function(event) {
        try {
            if (event.data.type === 'load-image' || event.data.type === 'open-image') {
                // Handle both message types
                const data = event.data;
                
                // For open-image messages, normalize the data format
                if (event.data.type === 'open-image') {
                    // Extract image name from path if needed
                    if (data.imagePath && !data.imageName) {
                        const pathParts = data.imagePath.split('/');
                        data.imageName = pathParts[pathParts.length - 1];
                    }
                }
                
                handleLoadImage(data);
            } else if (event.data.type === 'window-state-update') {
                isWindowMaximized = event.data.isMaximized;
            }
        } catch (err) {
            console.error("Error handling window message:", err);
            imageInfo.textContent = "Error loading image";
        }
    });
    
    // Notify parent window that the viewer is ready to receive images
    window.parent.postMessage({ type: 'image-viewer-ready' }, '*');
    
    function handleLoadImage(data) {
        // Don't interrupt current loading operation
        if (isLoadingImage) {
            console.log("Already loading image, queuing request");
            // Further reduce delay from 100ms to 50ms
            setTimeout(() => handleLoadImage(data), 50);
            return;
        }
        
        isLoadingImage = true;
        
        imageName = data.imageName || '';
        
        if (data.isMaximized !== undefined) {
            isWindowMaximized = data.isMaximized;
        }
        
        // Update info immediately
        imageInfo.textContent = imageName;
        
        // Disable any transition before hiding the image to avoid fade effects
        imageDisplay.style.transition = 'none';
        
        // Keep image hidden until loaded
        imageDisplay.style.visibility = 'hidden';
        imageDisplay.style.opacity = '0';
        
        // Force browser to apply the no-transition state
        // This trick forces the browser to apply the style changes immediately
        window.getComputedStyle(imageDisplay).opacity;
        
        // Disable navigation buttons during load
        prevButton.disabled = true;
        nextButton.disabled = true;
        
        // Clear any previous error messages
        Array.from(imageContainer.querySelectorAll('.error-message')).forEach(errorEl => errorEl.remove());
        
        // If imagePath is provided directly, use it - but fix relative paths
        let imagePath;
        if (data.imagePath) {
            // Fix relative paths that start with ./ by changing to ../../
            if (data.imagePath.startsWith('./')) {
                imagePath = '../../' + data.imagePath.substring(2);
            } else {
                // Otherwise use the provided path
                imagePath = data.imagePath;
            }
        } else {
            // Otherwise build it from the image name
            imagePath = `../../assets/images/full/${imageName}`;
        }
        
        // Reset view settings
        currentZoom = 0.825;
        currentRotation = 0;
        
        // Clear previous image and any pending event handlers
        imageDisplay.onload = null;
        imageDisplay.onerror = null;
        imageDisplay.src = '';
        
        console.log(`About to load image from path: ${imagePath}`);
        
        // Set up image load handler
        imageDisplay.onload = function() {
            handleImageLoaded();
            isLoadingImage = false;
        };
        
        imageDisplay.onerror = function() {
            handleImageError(imageName);
            isLoadingImage = false;
        };
        
        // Set the src immediately to start loading
        imageDisplay.src = imagePath;
    }
    
    function handleImageLoaded() {
        // Apply transform while transition is still disabled
        imageDisplay.style.transform = `scale(${currentZoom}) rotate(${currentRotation}deg)`;
        
        // Make image visible immediately without transition
        imageDisplay.style.visibility = 'visible';
        imageDisplay.style.opacity = '1';
        
        // Force browser to apply visibility changes before enabling transition
        window.getComputedStyle(imageDisplay).opacity;
        
        // Restore transform transition only after image is visible
        imageDisplay.style.transition = 'transform 0.2s ease';
        
        // Update info
        imageInfo.textContent = imageName;
        zoomLevel.textContent = '100%';
        
        // Setup image array for navigation - ensure using correct path format
        imagesArray = [
            { name: 'image1.jpg', path: '../../assets/images/full/image1.jpg' },
            { name: 'image2.jpg', path: '../../assets/images/full/image2.jpg' },
            { name: 'image3.jpg', path: '../../assets/images/full/image3.jpg' },
            { name: 'image4.jpg', path: '../../assets/images/full/image4.jpg' },
            { name: 'image5.jpg', path: '../../assets/images/full/image5.jpg' }
        ];
        
        currentImageIndex = imagesArray.findIndex(img => img.name === imageName);
        if (currentImageIndex === -1) currentImageIndex = 0;
        
        updateNavigationButtons();
        
        // Handle window sizing/notification
        if (!initialImageLoaded) {
            if (!isWindowMaximized) {
                notifyParentAboutImage(true);
            } else {
                notifyParentAboutImage();
            }
            initialImageLoaded = true;
        } else {
            notifyParentAboutImage(false);
        }
    }
    
    function handleImageError(imageName) {
        // Ensure image is completely hidden
        imageDisplay.style.visibility = 'hidden';
        imageDisplay.style.opacity = '0';
        imageDisplay.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        
        // Update info
        imageInfo.textContent = `Error: Could not load ${imageName}`;
        
        // Create error message with improved styling
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.display = 'flex'; // Make error message visible
        errorDiv.style.flexDirection = 'column';
        errorDiv.style.alignItems = 'center';
        errorDiv.style.justifyContent = 'center';
        errorDiv.style.color = 'white';
        errorDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
        errorDiv.style.padding = '20px';
        errorDiv.style.borderRadius = '8px';
        errorDiv.style.margin = 'auto';
        
        errorDiv.innerHTML = `
            <h3>Image Failed to Load</h3>
            <p>Could not display: ${imageName}</p>
            <p>Please check that the file exists in:</p>
            <p class="path">assets/images/full/</p>
        `;
        
        // Clear any previous errors
        Array.from(imageContainer.querySelectorAll('.error-message')).forEach(el => el.remove());
        
        // Add new error
        imageContainer.appendChild(errorDiv);
        
        // Enable navigation buttons so user can try another image
        updateNavigationButtons();
    }
    
    // Enable navigation buttons
    function updateNavigationButtons() {
        prevButton.disabled = false;
        nextButton.disabled = false;
    }
    
    // Zoom in
    zoomInButton.addEventListener('click', function() {
        if (currentZoom < 3) {
            currentZoom += 0.25;
            updateImageTransform();
            zoomLevel.textContent = `${Math.round(currentZoom * displayScaleFactor * 100)}%`;
        }
    });
    
    // Zoom out
    zoomOutButton.addEventListener('click', function() {
        if (currentZoom > 0.25) {
            currentZoom -= 0.25;
            updateImageTransform();
            zoomLevel.textContent = `${Math.round(currentZoom * displayScaleFactor * 100)}%`;
        }
    });
    
    // Rotate image
    rotateButton.addEventListener('click', function() {
        currentRotation += 90;
        imageDisplay.style.transform = `scale(${currentZoom}) rotate(${currentRotation}deg)`;
        zoomLevel.textContent = `${Math.round(currentZoom * displayScaleFactor * 100)}%`;
    });
    
    // Navigate to previous image
    prevButton.addEventListener('click', function() {
        if (isLoadingImage) return; // Ignore clicks during loading
        
        if (currentImageIndex > 0) {
            currentImageIndex--;
        } else {
            currentImageIndex = imagesArray.length - 1;
        }
        loadImageAtIndex();
    });
    
    // Navigate to next image
    nextButton.addEventListener('click', function() {
        if (isLoadingImage) return; // Ignore clicks during loading
        
        if (currentImageIndex < imagesArray.length - 1) {
            currentImageIndex++;
        } else {
            currentImageIndex = 0;
        }
        loadImageAtIndex();
    });
    
    // Update image transform
    function updateImageTransform() {
        imageDisplay.style.transform = `scale(${currentZoom}) rotate(${currentRotation}deg)`;
    }
    
    // Load image at current index
    function loadImageAtIndex() {
        // Don't do anything if we're already loading
        if (isLoadingImage) return;
        
        if (imagesArray[currentImageIndex]) {
            isLoadingImage = true;
            
            // Disable navigation buttons during load
            prevButton.disabled = true;
            nextButton.disabled = true;
            
            const image = imagesArray[currentImageIndex];
            
            // Clear any previous errors
            Array.from(imageContainer.querySelectorAll('.error-message')).forEach(el => el.remove());
            
            // Disable transition completely - don't store it as we'll set the correct one later
            imageDisplay.style.transition = 'none';
            
            // Force browser to apply the no-transition state
            window.getComputedStyle(imageDisplay).opacity;
            
            // Hide image completely while loading
            imageDisplay.style.opacity = "0";
            imageDisplay.style.visibility = "hidden";
            
            // Cancel any pending loads by clearing event handlers
            imageDisplay.onload = null;
            imageDisplay.onerror = null;
            imageDisplay.src = '';
            
            console.log(`Loading next/prev image: ${image.path}`);
            
            // Reset view settings immediately without animation
            currentZoom = 0.825;
            currentRotation = 0;
            
            // Apply transform instantly while image is still hidden
            imageDisplay.style.transform = `scale(${currentZoom}) rotate(0deg)`;
            
            // Set up handlers
            imageDisplay.onload = function() {
                // Make image visible first while transition is still disabled
                imageDisplay.style.visibility = "visible";
                imageDisplay.style.opacity = "1";
                
                // Force browser to apply visibility changes
                window.getComputedStyle(imageDisplay).opacity;
                
                // Now restore only the transform transition, not opacity
                imageDisplay.style.transition = 'transform 0.2s ease';
                
                // Update info
                imageName = image.name;
                imageInfo.textContent = imageName;
                zoomLevel.textContent = '100%';
                
                // Never resize when navigating between images
                notifyParentAboutImage(false);
                
                // Re-enable navigation
                updateNavigationButtons();
                
                // Clear loading flag
                isLoadingImage = false;
            };
            
            imageDisplay.onerror = function() {
                handleImageError(image.name);
                isLoadingImage = false;
            };
            
            // Set the src to start loading
            imageDisplay.src = image.path;
        }
    }
    
    /**
     * Notify parent about new image without requesting resize
     * @param {boolean} allowResize - Whether to allow resize (false for navigation)
     */
    function notifyParentAboutImage(allowResize = true) {
        const imgWidth = imageDisplay.naturalWidth;
        const imgHeight = imageDisplay.naturalHeight;
        
        window.parent.postMessage({
            type: 'image-changed',
            imageName: imageName,
            imgWidth: imgWidth,
            imgHeight: imgHeight,
            preserveMaximized: true,
            allowResize: allowResize
        }, '*');
    }
});
