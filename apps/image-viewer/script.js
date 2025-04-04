// PhotoViewer - Complete rebuild with ultra-reliable image loading

(function() {
    // ========== INITIALIZATION ==========
    
    // DOM elements
    let imageDisplay = null;
    let imageContainer = null;
    let imageInfo = null;
    let zoomLevel = null;
    let prevButton = null;
    let nextButton = null;
    let zoomInButton = null;
    let zoomOutButton = null;
    let rotateButton = null;

    // State
    const state = {
        currentZoom: 0.825,
        currentRotation: 0,
        imageName: '',
        imagesArray: [
            { name: 'image1.jpg', path: '../../assets/apps/image-viewer/images/full/image1.jpg' },
            { name: 'image2.jpg', path: '../../assets/apps/image-viewer/images/full/image2.jpg' },
            { name: 'image3.jpg', path: '../../assets/apps/image-viewer/images/full/image3.jpg' },
            { name: 'image4.jpg', path: '../../assets/apps/image-viewer/images/full/image4.jpg' },
            { name: 'image5.jpg', path: '../../assets/apps/image-viewer/images/full/image5.jpg' }
        ],
        currentImageIndex: 0,
        isLoading: false,
        appReady: false,
        displayScaleFactor: 100 / 82.5,
        pendingImageLoad: null,
        readyCheckCount: 0,

        // Add direct reference to the actual image path being loaded
        currentlyLoading: null,

        // Keep track of ready state
        readyMessageSent: false,
        readyConfirmed: false,

        // Initialize with a sync flag to avoid race conditions
        initComplete: false
    };

    // Initialize everything once DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // If already loaded, init immediately
        init();
    }

    // ========== CORE FUNCTIONALITY ==========

    function init() {
        if (state.initComplete) return;
        state.initComplete = true;

        console.log('[PhotoViewer] Initializing');

        // Get DOM elements
        imageDisplay = document.getElementById('image-display');
        imageContainer = document.getElementById('image-container');
        imageInfo = document.getElementById('image-info');
        zoomLevel = document.getElementById('zoom-level');
        prevButton = document.getElementById('prev-button');
        nextButton = document.getElementById('next-button');
        zoomInButton = document.getElementById('zoom-in-button');
        zoomOutButton = document.getElementById('zoom-out-button');
        rotateButton = document.getElementById('rotate-button');

        // Set up event listeners
        setupEventListeners();
        setupTooltips();

        // Initialize the app (100ms delay to ensure everything is ready)
        setTimeout(() => {
            state.appReady = true;

            // Send ready signal to parent
            notifyReady();

            // Check if there's a pending image to load
            if (state.pendingImageLoad) {
                loadImage(state.pendingImageLoad);
                state.pendingImageLoad = null;
            }
        }, 100);
    }

    // Setup all event listeners
    function setupEventListeners() {
        // Prevent selection and dragging throughout the app
        document.addEventListener('mousedown', function(e) {
            if (!e.target.classList.contains('toolbar-button')) {
                e.preventDefault();
            }
        });

        document.addEventListener('dragstart', e => e.preventDefault());

        // Navigation buttons
        prevButton.addEventListener('click', prevImage);
        nextButton.addEventListener('click', nextImage);

        // Zoom and rotation
        zoomInButton.addEventListener('click', zoomIn);
        zoomOutButton.addEventListener('click', zoomOut);
        rotateButton.addEventListener('click', rotateImage);

        // Message communication with parent window
        window.addEventListener('message', handleMessage);
    }

    // Tooltip functionality
    function setupTooltips() {
        let activeTooltip = null;

        const buttons = document.querySelectorAll('.toolbar-button');

        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                const tooltipText = button.getAttribute('data-tooltip');
                if (!tooltipText) return;

                if (activeTooltip) {
                    activeTooltip.remove();
                }

                const tooltip = document.createElement('div');
                tooltip.className = 'viewer-tooltip';
                tooltip.textContent = tooltipText;
                document.body.appendChild(tooltip);
                activeTooltip = tooltip;

                const rect = button.getBoundingClientRect();
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
            });

            button.addEventListener('mouseleave', () => {
                if (activeTooltip) {
                    activeTooltip.remove();
                    activeTooltip = null;
                }
            });
        });
    }

    // ========== PARENT WINDOW COMMUNICATION ==========

    // Send ready signal to parent window with guaranteed delivery
    function notifyReady() {
        if (!state.readyMessageSent) {
            console.log('[PhotoViewer] Sending ready signal to parent');
            state.readyMessageSent = true;

            // Send the ready message
            window.parent.postMessage({
                type: 'image-viewer-ready',
                timestamp: Date.now()
            }, '*');

            // Start a retry interval for reliability
            const readyInterval = setInterval(() => {
                if (state.readyConfirmed || state.readyCheckCount >= 10) {
                    clearInterval(readyInterval);
                    return;
                }

                state.readyCheckCount++;
                console.log(`[PhotoViewer] Ready signal retry #${state.readyCheckCount}`);
                window.parent.postMessage({
                    type: 'image-viewer-ready',
                    retry: state.readyCheckCount,
                    timestamp: Date.now()
                }, '*');
            }, 500);
        }
    }

    // Handle incoming messages from parent window
    function handleMessage(event) {
        const data = event.data;
        if (!data || !data.type) return;

        console.log(`[PhotoViewer] Received message: ${data.type}`);

        switch (data.type) {
            case 'open-image':
            case 'load-image':
                // Extract image info
                const imagePath = data.imagePath;
                const imageName = data.imageName || extractFilenameFromPath(imagePath);

                // Acknowledge receipt immediately before doing anything else
                console.log(`[PhotoViewer] Acknowledging receipt of image: ${imagePath}`);
                window.parent.postMessage({
                    type: 'image-open-received',
                    imagePath: imagePath,
                    timestamp: Date.now()
                }, '*');

                // Load the image
                if (state.appReady) {
                    loadImage({
                        path: imagePath,
                        name: imageName
                    });
                } else {
                    console.log('[PhotoViewer] App not ready, storing image for later');
                    state.pendingImageLoad = {
                        path: imagePath,
                        name: imageName
                    };

                    // Force ready check again
                    notifyReady();
                }
                break;

            case 'window-state-update':
                // Just store window state
                state.isMaximized = !!data.isMaximized;
                break;

            case 'check-viewer-ready':
                // Parent is checking if we're ready
                notifyReady();
                break;

            case 'ready-acknowledged':
                // Parent confirmed our ready message
                state.readyConfirmed = true;
                console.log('[PhotoViewer] Ready state confirmed by parent');

                // If the acknowledgment contains a pending image, load it
                if (data.pendingImagePath) {
                    console.log('[PhotoViewer] Loading image from acknowledgment');
                    loadImage({
                        path: data.pendingImagePath,
                        name: extractFilenameFromPath(data.pendingImagePath)
                    });
                }
                break;
        }
    }

    // ========== IMAGE HANDLING ==========

    // Load an image
    function loadImage(imageData) {
        if (!imageData || !imageData.path) {
            console.error('[PhotoViewer] Invalid image data');
            return;
        }

        // If already loading, wait until current load finishes
        if (state.isLoading) {
            console.log('[PhotoViewer] Already loading, waiting 100ms');
            setTimeout(() => loadImage(imageData), 100);
            return;
        }

        state.isLoading = true;
        console.log(`[PhotoViewer] Loading image: ${imageData.path}`);

        // Update the info immediately
        state.imageName = imageData.name || '';
        imageInfo.textContent = state.imageName;

        // Disable navigation buttons
        prevButton.disabled = true;
        nextButton.disabled = true;

        // Reset view settings
        state.currentZoom = 0.825;
        state.currentRotation = 0;

        // Prepare the image (completely hide it first)
        imageDisplay.style.transition = 'none';
        imageDisplay.style.visibility = 'hidden';
        imageDisplay.style.opacity = '0';
        imageDisplay.style.transform = `scale(${state.currentZoom}) rotate(${state.currentRotation}deg)`;

        // Force styles to apply
        window.getComputedStyle(imageDisplay).opacity;

        // Clear any previous error messages
        const errorElements = imageContainer.querySelectorAll('.error-message');
        errorElements.forEach(el => el.remove());

        // Process the path
        let imagePath = imageData.path;
        if (imagePath.startsWith('./')) {
            imagePath = '../../' + imagePath.substring(2);
        }

        // Store the current path being loaded (helps prevent race conditions)
        state.currentlyLoading = imagePath;

        // Clear previous image and event handlers
        imageDisplay.onload = null;
        imageDisplay.onerror = null;
        imageDisplay.src = '';

        // Add new handlers
        imageDisplay.onload = function() {
            // Only process if this is still the current image being loaded
            if (state.currentlyLoading !== imagePath) {
                console.log('[PhotoViewer] Ignoring stale image load');
                return;
            }

            console.log('[PhotoViewer] Image loaded successfully');

            // Make image visible
            imageDisplay.style.visibility = 'visible';
            imageDisplay.style.opacity = '1';

            // Force browser to apply visibility
            window.getComputedStyle(imageDisplay).opacity;

            // Re-enable transition for future transformations
            imageDisplay.style.transition = 'transform 0.2s ease';

            // Update info
            imageInfo.textContent = state.imageName;
            zoomLevel.textContent = '100%';

            // Find index of image in array for navigation
            state.currentImageIndex = state.imagesArray.findIndex(img => img.name === state.imageName);
            if (state.currentImageIndex === -1) state.currentImageIndex = 0;

            // Re-enable navigation
            prevButton.disabled = false;
            nextButton.disabled = false;

            // Notify parent about successful load
            notifyParentAboutImage();

            // Clear loading state and path
            state.isLoading = false;
            state.currentlyLoading = null;
        };

        imageDisplay.onerror = function() {
            // Only process if this is still the current image being loaded
            if (state.currentlyLoading !== imagePath) {
                console.log('[PhotoViewer] Ignoring stale image error');
                return;
            }

            console.error(`[PhotoViewer] Failed to load image: ${imagePath}`);

            // Hide the image
            imageDisplay.style.visibility = 'hidden';
            imageDisplay.style.opacity = '0';
            imageDisplay.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

            // Update info
            imageInfo.textContent = `Error: Could not load ${state.imageName}`;

            // Create error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.style.display = 'flex';
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
                <p>Could not display: ${state.imageName}</p>
                <p>Please check that the file exists in:</p>
                <p class="path">assets/apps/image-viewer/images/full/</p>
            `;

            imageContainer.appendChild(errorDiv);

            // Re-enable navigation
            prevButton.disabled = false;
            nextButton.disabled = false;

            // Clear loading state and path
            state.isLoading = false;
            state.currentlyLoading = null;
        };

        // Set image source to start loading (do this last)
        console.log(`[PhotoViewer] Setting image src: ${imagePath}`);
        imageDisplay.src = imagePath;
    }

    // Navigate to previous image
    function prevImage() {
        if (state.isLoading) return;

        if (state.currentImageIndex > 0) {
            state.currentImageIndex--;
        } else {
            state.currentImageIndex = state.imagesArray.length - 1;
        }

        navigateToImageIndex();
    }

    // Navigate to next image
    function nextImage() {
        if (state.isLoading) return;

        if (state.currentImageIndex < state.imagesArray.length - 1) {
            state.currentImageIndex++;
        } else {
            state.currentImageIndex = 0;
        }

        navigateToImageIndex();
    }

    // Load image at current index
    function navigateToImageIndex() {
        if (state.isLoading) return;

        const image = state.imagesArray[state.currentImageIndex];
        if (image) {
            loadImage({
                path: image.path,
                name: image.name
            });
        }
    }

    // Notify parent about loaded image
    function notifyParentAboutImage() {
        const imgWidth = imageDisplay.naturalWidth;
        const imgHeight = imageDisplay.naturalHeight;

        window.parent.postMessage({
            type: 'image-changed',
            imageName: state.imageName,
            imgWidth: imgWidth,
            imgHeight: imgHeight,
            preserveMaximized: true,
            allowResize: true
        }, '*');
    }

    // ========== IMAGE OPERATIONS ==========

    // Zoom in
    function zoomIn() {
        if (state.currentZoom < 3) {
            state.currentZoom += 0.25;
            updateImageTransform();
            updateZoomInfo();
        }
    }

    // Zoom out
    function zoomOut() {
        if (state.currentZoom > 0.25) {
            state.currentZoom -= 0.25;
            updateImageTransform();
            updateZoomInfo();
        }
    }

    // Rotate image
    function rotateImage() {
        state.currentRotation += 90;
        updateImageTransform();
        updateZoomInfo();
    }

    // Apply transform to image
    function updateImageTransform() {
        imageDisplay.style.transform = `scale(${state.currentZoom}) rotate(${state.currentRotation}deg)`;
    }

    // Update zoom display
    function updateZoomInfo() {
        zoomLevel.textContent = `${Math.round(state.currentZoom * state.displayScaleFactor * 100)}%`;
    }

    // ========== UTILITY FUNCTIONS ==========

    // Extract filename from path
    function extractFilenameFromPath(path) {
        if (!path) return '';
        const parts = path.split('/');
        return parts[parts.length - 1];
    }
})();
