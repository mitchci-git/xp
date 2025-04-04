class WindowTemplates {
    static getTemplate(templateName, title) {
        switch(templateName) {
            case 'my-computer':
                return this.createMyComputerContent();
            case 'folder-view':
                return this.createFolderViewContent(title);
            case 'browser':
                return this.createBrowserContent();
            case 'messenger':
                return this.createMessengerContent();
            case 'image-viewer':
                return this.createImageViewerContent();
            case 'email':
                return this.createEmailContent();
            case 'music-player':
                return this.createMusicPlayerContent();
            default:
                return this.createEmptyContent();
        }
    }
    
    /**
     * Create iframe container for window content
     * @param {string} appName - Name of the application
     * @param {string} title - Window title
     * @param {string} className - Optional custom class name for container
     * @returns {HTMLElement} Container with iframe
     */
    static createIframeContainer(appName, title, className = 'special-iframe-container') {
        const content = document.createElement('div');
        content.className = `window-body ${className}`;
        
        // Create and configure iframe
        const iframe = document.createElement('iframe');
        
        // Sanitize title parameter for security
        const sanitizedTitle = title ? encodeURIComponent(title.replace(/[^\w\s-]/g, '')) : '';
        const sanitizedAppName = appName.replace(/[^\w\s-]/g, '');
        
        // Construct safe URL with sanitized parameters
        iframe.src = `./apps/${sanitizedAppName}/index.html` + (sanitizedTitle ? `?title=${sanitizedTitle}&windowId=${encodeURIComponent(sanitizedAppName + '-window')}` : '');
        iframe.className = `${sanitizedAppName}-frame`;
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowtransparency', 'true');
        iframe.setAttribute('data-app', sanitizedAppName);
        
        // Set explicit styles for reliable rendering
        Object.assign(iframe.style, {
            width: '100%',
            height: '100%',
            border: 'none',
            margin: '0',
            padding: '0',
            overflow: 'hidden'
        });
        
        // Add event listeners for better focus handling
        iframe.addEventListener('mouseenter', function() {
            // Find parent window and dispatch custom event
            let currentNode = this.parentNode;
            while (currentNode && !currentNode.classList.contains('window')) {
                currentNode = currentNode.parentNode;
            }
            
            if (currentNode) {
                // Custom focus event that bubbles up to window
                const focusEvent = new CustomEvent('iframe:focus', {
                    bubbles: true,
                    detail: { source: `${appName}-iframe` }
                });
                currentNode.dispatchEvent(focusEvent);
            }
        });
        
        // Add load event listener to initialize iframe communication
        iframe.addEventListener('load', () => {
            // Use a more specific targetOrigin for additional security
            const targetOrigin = window.location.origin;
            iframe.contentWindow.postMessage({
                type: 'init-parent-comm',
                windowId: sanitizedAppName + '-window'
            }, targetOrigin === 'null' ? '*' : targetOrigin);
        });
        
        content.appendChild(iframe);
        return content;
    }
    
    /**
     * Create content for My Computer window
     * @returns {HTMLElement} The window content
     */
    static createMyComputerContent() {
        return this.createIframeContainer('my-computer', 'My Computer');
    }
    
    /**
     * Create content for a folder view window
     * @param {string} title - The folder title to display
     * @returns {HTMLElement} The window content
     */
    static createFolderViewContent(title) {
        // Skip iframe for My Pictures - use direct DOM content instead
        if (title === 'My Pictures') {
            const content = document.createElement('div');
            content.className = 'window-body';
            content.innerHTML = `
                <div class="window-content with-sidebar">
                    <div class="sidebar">
                        <div class="sidebar-title">Picture Tasks</div>
                        <ul class="sidebar-list">
                            <li><a href="#" class="sidebar-link" data-action="slideshow">View as a slide show</a></li>
                            <li><a href="#" class="sidebar-link" data-action="prints">Order prints online</a></li>
                            <li><a href="#" class="sidebar-link" data-action="print">Print pictures</a></li>
                        </ul>
                        
                        <div class="sidebar-title">File and Folder Tasks</div>
                        <ul class="sidebar-list">
                            <li><a href="#" class="sidebar-link" data-action="new-folder">Make a new folder</a></li>
                            <li><a href="#" class="sidebar-link" data-action="share">Share this folder</a></li>
                        </ul>
                        
                        <div class="sidebar-title">Other Places</div>
                        <ul class="sidebar-list">
                            <li><a href="#" class="sidebar-link" data-action="my-computer">My Computer</a></li>
                            <li><a href="#" class="sidebar-link" data-action="my-documents">My Documents</a></li>
                            <li><a href="#" class="sidebar-link" data-action="shared">Shared Pictures</a></li>
                        </ul>
                    </div>
                    <div class="content">
                        <div class="address-bar">
                            <div class="address-icon">📁</div>
                            <div class="address-text">My Pictures</div>
                        </div>
                        <div class="folder-view" id="folder-view">
                            <div class="thumbnails-view" id="thumbnails-view">
                                <div class="thumbnail-item" data-image="image1.jpg">
                                    <div class="thumbnail-container">
                                        <img src="./assets/images/thumb/image1.jpg" alt="Image 1">
                                    </div>
                                    <span class="filename">image1.jpg</span>
                                </div>
                                <div class="thumbnail-item" data-image="image2.jpg">
                                    <div class="thumbnail-container">
                                        <img src="./assets/images/thumb/image2.jpg" alt="Image 2">
                                    </div>
                                    <span class="filename">image2.jpg</span>
                                </div>
                                <div class="thumbnail-item" data-image="image3.jpg">
                                    <div class="thumbnail-container">
                                        <img src="./assets/images/thumb/image3.jpg" alt="Image 3">
                                    </div>
                                    <span class="filename">image3.jpg</span>
                                </div>
                                <div class="thumbnail-item" data-image="image4.jpg">
                                    <div class="thumbnail-container">
                                        <img src="./assets/images/thumb/image4.jpg" alt="Image 4">
                                    </div>
                                    <span class="filename">image4.jpg</span>
                                </div>
                                <div class="thumbnail-item" data-image="image5.jpg">
                                    <div class="thumbnail-container">
                                        <img src="./assets/images/thumb/image5.jpg" alt="Image 5">
                                    </div>
                                    <span class="filename">image5.jpg</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Immediately set up event handlers on the DOM nodes
            const thumbnails = content.querySelectorAll('.thumbnail-item');
            const folderView = content.querySelector('#folder-view');
            
            thumbnails.forEach(thumbnail => {
                // Direct mousedown handler for selection
                thumbnail.onmousedown = function(e) {
                    e.stopPropagation();
                    
                    // Clear all selections first
                    thumbnails.forEach(item => {
                        item.classList.remove('selected');
                    });
                    
                    // Add selected class to this item
                    this.classList.add('selected');
                };
                
                // Double-click handler for opening image
                thumbnail.ondblclick = function(e) {
                    e.stopPropagation();
                    
                    const imageName = this.getAttribute('data-image');
                    
                    window.dispatchEvent(new CustomEvent('my-pictures:open-image', {
                        detail: {
                            imageName: imageName,
                            imagePath: `./assets/images/full/${imageName}`
                        }
                    }));
                    
                    // Clear all selections
                    thumbnails.forEach(item => {
                        item.classList.remove('selected');
                    });
                };
                
                // Prevent dragging
                thumbnail.ondragstart = function(e) {
                    e.preventDefault();
                    return false;
                };
            });
            
            // Click on empty space clears selection
            folderView.onclick = function(e) {
                if (e.target === folderView || e.target.id === 'thumbnails-view') {
                    thumbnails.forEach(item => {
                        item.classList.remove('selected');
                    });
                }
            };
            
            // Handle sidebar links
            const sidebarLinks = content.querySelectorAll('.sidebar-link');
            sidebarLinks.forEach(link => {
                link.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    window.dispatchEvent(new CustomEvent('my-pictures:action', {
                        detail: {
                            action: link.getAttribute('data-action'),
                            text: link.textContent,
                            folder: 'My Pictures'
                        }
                    }));
                    
                    return false;
                };
            });
            
            return content;
        }
        
        // Use iframe for all other folders
        return this.createIframeContainer('folder-view', title);
    }
    
    /**
     * Create content for Internet Explorer
     * @returns {HTMLElement} The window content
     */
    static createBrowserContent() {
        return this.createIframeContainer('browser', 'Internet Explorer');
    }
    
    /**
     * Create content for Windows Messenger
     * @returns {HTMLElement} The window content
     */
    static createMessengerContent() {
        return this.createIframeContainer('windows-messenger', null, 'special-messenger-container');
    }

    /**
     * Create content for Image Viewer window
     * @param {string} [imagePath] - Optional path to an image to open
     * @returns {HTMLElement} The window content
     */
    static createImageViewerContent(imagePath) {
        // Create an extremely simplified global state object
        window._photoViewerGlobalState = window._photoViewerGlobalState || {
            pendingImageToOpen: null,
            iframeReady: false,
            imageAcknowledged: false,
            currentIframe: null,
            fatalErrorCount: 0,
            // Add a last attempt tracking
            lastAttemptTime: 0
        };
        
        // Store any pending image path
        if (imagePath) {
            console.log('[WindowManager] Setting pending image to open:', imagePath);
            window._photoViewerGlobalState.pendingImageToOpen = imagePath;
            window._photoViewerGlobalState.imageAcknowledged = false;
        }
        
        // Create the container directly
        const content = document.createElement('div');
        content.className = `window-body special-iframe-container`;
        
        // Create and configure iframe with extreme simplicity
        const iframe = document.createElement('iframe');
        
        // Set essential attributes only
        iframe.className = 'image-viewer-frame';
        iframe.src = './apps/image-viewer/index.html';
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowtransparency', 'true');
        
        // Set basic styles
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.margin = '0';
        iframe.style.padding = '0';
        iframe.style.overflow = 'hidden';
        
        // Store reference to current iframe
        window._photoViewerGlobalState.currentIframe = iframe;
        
        // More aggressive message handling setup
        if (!window._photoViewerMessageHandlerSet) {
            window._photoViewerMessageHandlerSet = true;
            
            // Overall message handler
            window.addEventListener('message', (event) => {
                const data = event.data;
                if (!data || !data.type) return;
                
                // Handle "ready" message from image viewer iframe
                if (data.type === 'image-viewer-ready') {
                    console.log('[WindowManager] Received ready message from image viewer');
                    window._photoViewerGlobalState.iframeReady = true;
                    window._photoViewerGlobalState.lastAttemptTime = Date.now();
                    
                    // Send acknowledgment
                    if (event.source && typeof event.source.postMessage === 'function') {
                        // Include any pending image path in the acknowledgment
                        event.source.postMessage({
                            type: 'ready-acknowledged',
                            pendingImagePath: window._photoViewerGlobalState.pendingImageToOpen,
                            timestamp: Date.now()
                        }, '*');
                        
                        // Try sending the pending image if one is waiting
                        if (window._photoViewerGlobalState.pendingImageToOpen) {
                            sendPendingImageWithRetries(event.source);
                        }
                    }
                }
                // Handle image receipt acknowledgment
                else if (data.type === 'image-open-received') {
                    console.log('[WindowManager] Image receipt acknowledged:', data.imagePath);
                    if (data.imagePath === window._photoViewerGlobalState.pendingImageToOpen) {
                        window._photoViewerGlobalState.imageAcknowledged = true;
                        window._photoViewerGlobalState.lastAttemptTime = Date.now();
                        // Don't clear the pending image here, wait for actual load confirmation
                    }
                }
                // Handle successful image load confirmation
                else if (data.type === 'image-changed') {
                    console.log('[WindowManager] Image successfully loaded:', data.imageName);
                    // Now we can safely clear the pending image
                    window._photoViewerGlobalState.pendingImageToOpen = null;
                }
            });
        }
        
        // Function to send pending image with multiple retries
        function sendPendingImageWithRetries(target) {
            const pendingImage = window._photoViewerGlobalState.pendingImageToOpen;
            if (!pendingImage) return;
            
            console.log('[WindowManager] Sending pending image:', pendingImage);
            window._photoViewerGlobalState.lastAttemptTime = Date.now();
            
            // Send with most basic object possible
            try {
                // Immediately send the first attempt
                target.postMessage({
                    type: 'open-image',
                    imagePath: pendingImage,
                    timestamp: Date.now()
                }, '*');
                
                // Set up additional retries
                const maxRetries = 5;
                for (let i = 1; i <= maxRetries; i++) {
                    setTimeout(() => {
                        // Only send retry if not acknowledged yet
                        if (window._photoViewerGlobalState.pendingImageToOpen === pendingImage && 
                            !window._photoViewerGlobalState.imageAcknowledged) {
                            
                            console.log(`[WindowManager] Retry #${i} sending image:`, pendingImage);
                            try {
                                target.postMessage({
                                    type: 'open-image',
                                    imagePath: pendingImage,
                                    timestamp: Date.now(),
                                    retry: i
                                }, '*');
                            } catch (err) {
                                console.error('[WindowManager] Error during retry:', err);
                            }
                        }
                    }, i * 200); // Increasing delay between retries
                }
                
                // Final cleanup after all retries
                setTimeout(() => {
                    if (window._photoViewerGlobalState.pendingImageToOpen === pendingImage && 
                        !window._photoViewerGlobalState.imageAcknowledged &&
                        Date.now() - window._photoViewerGlobalState.lastAttemptTime > 2000) {
                        
                        console.warn('[WindowManager] No image acknowledgment received after all retries, clearing');
                        window._photoViewerGlobalState.pendingImageToOpen = null;
                    }
                }, 3000);
                
            } catch (err) {
                console.error('[WindowManager] Error sending image to viewer:', err);
            }
        }
        
        // Setup reliable load event for iframe
        iframe.onload = function() {
            console.log('[WindowManager] Image viewer iframe loaded');
            
            // Immediately check if we need to handle a pending image
            setTimeout(() => {
                // Ask the iframe if it's ready
                if (iframe.contentWindow) {
                    try {
                        iframe.contentWindow.postMessage({
                            type: 'check-viewer-ready'
                        }, '*');
                    } catch (e) {
                        console.error('[WindowManager] Error checking iframe ready state:', e);
                    }
                }
            }, 100);
        };
        
        // Add the iframe to the container
        content.appendChild(iframe);
        return content;
    }

    /**
     * Create content for Email application
     * @returns {HTMLElement} The window content
     */
    static createEmailContent() {
        return this.createIframeContainer('email', 'New Message - Outlook Express');
    }

    /**
     * Create content for Music Player window
     * @returns {HTMLElement} The window content
     */
    static createMusicPlayerContent() {
        const content = document.createElement('div');
        content.className = 'window-body special-iframe-container';
        
        // Create and configure iframe
        const iframe = document.createElement('iframe');
        
        // Sanitize parameters for security
        const sanitizedAppName = 'music-player';
        
        // Set source for the iframe
        iframe.src = `./apps/${sanitizedAppName}/index.html`;
        iframe.className = `${sanitizedAppName}-frame`;
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowtransparency', 'true');
        iframe.setAttribute('data-app', sanitizedAppName);
        iframe.setAttribute('scrolling', 'no'); // Explicitly disable scrolling
        
        // Apply scale transformation to make content 50% of original size
        Object.assign(iframe.style, {
            width: '100%',
            height: '100%',
            border: 'none',
            margin: '0',
            padding: '0',
            overflow: 'hidden',
            borderRadius: '21px', // 50% of original 43px
            backgroundColor: 'transparent',
            background: 'transparent',
            scrollbarWidth: 'none',
            borderWidth: '0',
            borderStyle: 'none',
            outline: 'none',
            boxSizing: 'border-box',
            // Apply scale transform to the iframe to make content 50% size
            transform: 'scale(0.5)',
            transformOrigin: 'top left',
            // Double width and height to maintain aspect ratio after scaling
            position: 'absolute',
            width: '200%',
            height: '200%'
        });
        
        // Add event listeners for focus handling
        iframe.addEventListener('mouseenter', function() {
            // Find parent window
            let currentNode = this.parentNode;
            while (currentNode && !currentNode.classList.contains('window')) {
                currentNode = currentNode.parentNode;
            }
            
            if (currentNode) {
                // Custom focus event that bubbles up to window
                const focusEvent = new CustomEvent('iframe:focus', {
                    bubbles: true,
                    detail: { source: `music-player-iframe` }
                });
                currentNode.dispatchEvent(focusEvent);
            }
        });
        
        // Add load event listener for iframe communication
        iframe.addEventListener('load', () => {
            const targetOrigin = window.location.origin;
            iframe.contentWindow.postMessage({
                type: 'init-parent-comm',
                windowId: 'music-player-window'
            }, targetOrigin === 'null' ? '*' : targetOrigin);
        });
        
        content.appendChild(iframe);
        
        // Apply additional styles to the container to ensure transparency
        Object.assign(content.style, {
            backgroundColor: 'transparent',
            background: 'transparent',
            border: 'none',
            borderRadius: '21px', // 50% of original 43px
            overflow: 'hidden',
            padding: '0',
            margin: '0',
            position: 'relative'
        });
        
        return content;
    }

    /**
     * Create empty content for unknown window types
     * @returns {HTMLElement} The window content
     */
    static createEmptyContent() {
        const content = document.createElement('div');
        content.className = 'window-body';
        content.innerHTML = '<div class="empty-content"><p>No content available for this window type.</p></div>';
        return content;
    }
}

export default WindowTemplates;
