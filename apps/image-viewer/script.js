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
            { name: 'image1.jpg', path: '../../assets/images/full/image1.jpg' },
            { name: 'image2.jpg', path: '../../assets/images/full/image2.jpg' },
            { name: 'image3.jpg', path: '../../assets/images/full/image3.jpg' },
            { name: 'image4.jpg', path: '../../assets/images/full/image4.jpg' },
            { name: 'image5.jpg', path: '../../assets/images/full/image5.jpg' }
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
        initComplete: false,
        
        // Add recovery mechanism flags
        hasAttemptedRecovery: false,
        recoveryAttempts: 0,
        maxRecoveryAttempts: 3,
        lastActivityTime: Date.now()
    };

    // Initialize immediately and set up a backup initialization
    init();
    
    // Double-check initialization after 50ms
    setTimeout(init, 50);
    
    // Triple-check initialization after 100ms
    setTimeout(init, 100);
    
    // Add a recovery mechanism that runs every 500ms
    const recoveryInterval = setInterval(checkAndRecover, 500);
    
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
        
        // Mark app as ready immediately
        state.appReady = true;
        state.lastActivityTime = Date.now();
        
        // Send ready signal to parent immediately
        sendReadySignal();
        
        // Set up a repeated ready signal for redundancy
        for (let i = 1; i <= 5; i++) {
            setTimeout(sendReadySignal, i * 100); // Send 5 times over 500ms
        }
    }
    
    // Recovery mechanism to check for lost messages or hanging state
    function checkAndRecover() {
        // Update last activity timestamp to prevent premature recovery
        if (document.visibilityState === 'visible') {
            state.lastActivityTime = Date.now();
        }
        
        // If initialization didn't happen, force it
        if (!state.initComplete) {
            console.warn('[PhotoViewer] Recovery: Forcing initialization');
            init();
        }
        
        // If ready wasn't confirmed and we have a pending image, resend ready signal
        if (!state.readyConfirmed && state.pendingImageLoad) {
            console.warn('[PhotoViewer] Recovery: Resending ready signal');
            sendReadySignal();
            
            // If we've waited too long, try to load the image directly
            if (state.recoveryAttempts >= 2 && state.pendingImageLoad) {
                console.warn('[PhotoViewer] Recovery: Forcing image load');
                const imageToLoad = state.pendingImageLoad;
                state.pendingImageLoad = null;
                loadImage(imageToLoad);
            }
        }
        
        // If no activity for 5 seconds, clear the recovery interval
        if (Date.now() - state.lastActivityTime > 5000) {
            console.log('[PhotoViewer] Recovery: Clearing recovery interval');
            clearInterval(recoveryInterval);
        }
        
        state.recoveryAttempts++;
    }
    
    // Setup all event listeners
    function setupEventListeners() {
        // Prevent selection and dragging throughout the app
        document.addEventListener('mousedown', function(e) {
            if (!e.target.classList.contains('toolbar-button')) {
                e.preventDefault();
            }
            state.lastActivityTime = Date.now();
        });
        
        document.addEventListener('dragstart', e => e.preventDefault());
        
        // Navigation buttons
        prevButton.addEventListener('click', function(e) {
            state.lastActivityTime = Date.now();
            prevImage();
        });
        
        nextButton.addEventListener('click', function(e) {
            state.lastActivityTime = Date.now();
            nextImage();
        });
        
        // Zoom and rotation
        zoomInButton.addEventListener('click', function(e) {
            state.lastActivityTime = Date.now();
            zoomIn();
        });
        
        zoomOutButton.addEventListener('click', function(e) {
            state.lastActivityTime = Date.now();
            zoomOut();
        });
        
        rotateButton.addEventListener('click', function(e) {
            state.lastActivityTime = Date.now();
            rotateImage();
        });
        
        // Message communication with parent window - ensure setup immediately
        window.addEventListener('message', handleMessage);
        
        // Make sure default text is cleared when we're initialized properly
        if (imageInfo && imageInfo.textContent === "Image name and details") {
            imageInfo.textContent = "";
        }
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
    
    // Send ready signal to parent window 
    function sendReadySignal() {
        state.lastActivityTime = Date.now();
        
        // Always send ready signal regardless of previous state
        console.log('[PhotoViewer] Sending ready signal to parent');
        state.readyMessageSent = true;
        
        try {
            // Send the ready message
            window.parent.postMessage({ 
                type: 'image-viewer-ready',
                timestamp: Date.now(),
                attempt: state.readyCheckCount + 1
            }, '*');
            
            state.readyCheckCount++;
        } catch (err) {
            console.error('[PhotoViewer] Error sending ready signal:', err);
        }
    }
    
    // Handle incoming messages from parent window
    function handleMessage(event) {
        const data = event.data;
        if (!data || !data.type) return;
        
        console.log(`[PhotoViewer] Received message: ${data.type}`, data);
        state.lastActivityTime = Date.now();
        
        switch (data.type) {
            case 'open-image':
            case 'load-image':
                // Extract image info
                const imagePath = data.imagePath;
                const imageName = data.imageName || extractFilenameFromPath(imagePath);
                
                // Acknowledge receipt immediately
                console.log(`[PhotoViewer] Acknowledging receipt of image: ${imagePath}`);
                try {
                    window.parent.postMessage({
                        type: 'image-open-received',
                        imagePath: imagePath,
                        timestamp: Date.now()
                    }, '*');
                } catch (err) {
                    console.error('[PhotoViewer] Error sending acknowledgment:', err);
                }
                
                // Load the image - always attempt to load regardless of ready state
                loadImage({
                    path: imagePath,
                    name: imageName
                });
                break;
                
            case 'window-state-update':
                // Just store window state
                state.isMaximized = !!data.isMaximized;
                break;
                
            case 'check-viewer-ready':
                // Parent is checking if we're ready - respond immediately
                sendReadySignal();
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
        
        state.lastActivityTime = Date.now();
        
        // If already loading, queue this image with very short delay
        if (state.isLoading) {
            console.log('[PhotoViewer] Already loading, queuing for 50ms');
            setTimeout(() => loadImage(imageData), 50);
            return;
        }
        
        state.isLoading = true;
        console.log(`[PhotoViewer] Loading image: ${imageData.path}`);
        
        // Update the info immediately
        state.imageName = imageData.name || '';
        if (imageInfo) {
            imageInfo.textContent = state.imageName;
        }
        
        // Disable navigation buttons
        if (prevButton) prevButton.disabled = true;
        if (nextButton) nextButton.disabled = true;
        
        // Reset view settings
        state.currentZoom = 0.825;
        state.currentRotation = 0;
        
        // Prepare the image (completely hide it first)
        if (imageDisplay) {
            imageDisplay.style.transition = 'none';
            imageDisplay.style.visibility = 'hidden';
            imageDisplay.style.opacity = '0';
            imageDisplay.style.transform = `scale(${state.currentZoom}) rotate(${state.currentRotation}deg)`;
            
            // Force styles to apply
            try {
                window.getComputedStyle(imageDisplay).opacity;
            } catch (err) {
                console.error('[PhotoViewer] Error getting computed style:', err);
            }
            
            // Clear previous image and event handlers
            imageDisplay.onload = null;
            imageDisplay.onerror = null;
            
            // Process the path
            let imagePath = imageData.path;
            if (imagePath.startsWith('./')) {
                imagePath = '../../' + imagePath.substring(2);
            }
            
            // Store the current path being loaded (helps prevent race conditions)
            state.currentlyLoading = imagePath;
            
            // Set empty source first to ensure proper loading
            imageDisplay.src = '';
            
            // Add new handlers
            imageDisplay.onload = function() {
                // Only process if this is still the current image being loaded
                if (state.currentlyLoading !== imagePath) {
                    console.log('[PhotoViewer] Ignoring stale image load');
                    return;
                }
                
                console.log('[PhotoViewer] Image loaded successfully');
                state.lastActivityTime = Date.now();
                
                // Make image visible
                imageDisplay.style.visibility = 'visible';
                imageDisplay.style.opacity = '1';
                
                // Force browser to apply visibility
                try {
                    window.getComputedStyle(imageDisplay).opacity;
                } catch (err) {
                    console.error('[PhotoViewer] Error getting computed style:', err);
                }
                
                // Re-enable transition for future transformations
                imageDisplay.style.transition = 'transform 0.2s ease';
                
                // Update info
                if (imageInfo) imageInfo.textContent = state.imageName;
                if (zoomLevel) zoomLevel.textContent = '100%';
                
                // Find index of image in array for navigation
                state.currentImageIndex = state.imagesArray.findIndex(img => img.name === state.imageName);
                if (state.currentImageIndex === -1) state.currentImageIndex = 0;
                
                // Re-enable navigation
                if (prevButton) prevButton.disabled = false;
                if (nextButton) nextButton.disabled = false;
                
                // Notify parent about successful load
                notifyParentAboutImage();
                
                // Clear loading state and path
                state.isLoading = false;
                state.currentlyLoading = null;
            };
            
            imageDisplay.onerror = function(err) {
                console.error(`[PhotoViewer] Failed to load image: ${imagePath}`, err);
                state.lastActivityTime = Date.now();
                
                // Hide the image
                imageDisplay.style.visibility = 'hidden';
                imageDisplay.style.opacity = '0';
                imageDisplay.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                
                // Update info
                if (imageInfo) imageInfo.textContent = `Error: Could not load ${state.imageName}`;
                
                // Create error message
                if (imageContainer) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'image-error';
                    errorDiv.innerHTML = `
                        <h3>Image Failed to Load</h3>
                        <p>Could not display: ${state.imageName}</p>
                        <p>Please check that the file exists and try again.</p>
                    `;
                    
                    // Clear any previous error messages
                    const previousErrors = imageContainer.querySelectorAll('.image-error');
                    previousErrors.forEach(el => el.remove());
                    
                    imageContainer.appendChild(errorDiv);
                }
                
                // Re-enable navigation
                if (prevButton) prevButton.disabled = false;
                if (nextButton) nextButton.disabled = false;
                
                // Clear loading state and path
                state.isLoading = false;
                state.currentlyLoading = null;
            };
            
            // Set image source to start loading (do this last)
            console.log(`[PhotoViewer] Setting image src: ${imagePath}`);
            setTimeout(() => {
                if (imageDisplay) {
                    imageDisplay.src = imagePath;
                }
            }, 0);
        } else {
            console.error('[PhotoViewer] Image display element not found');
            state.isLoading = false;
        }
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
        if (!imageDisplay) return;
        
        const imgWidth = imageDisplay.naturalWidth;
        const imgHeight = imageDisplay.naturalHeight;
        
        try {
            window.parent.postMessage({
                type: 'image-changed',
                imageName: state.imageName,
                imgWidth: imgWidth,
                imgHeight: imgHeight,
                preserveMaximized: true,
                allowResize: true
            }, '*');
        } catch (err) {
            console.error('[PhotoViewer] Error notifying parent about image:', err);
        }
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
