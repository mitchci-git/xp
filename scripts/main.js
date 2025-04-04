/**
 * Windows XP Simulation Main Script
 * Entry point for the application that initializes all components
 */
import Desktop from './gui/desktop.js';
import Taskbar from './gui/taskbar.js';
import WindowManager from './gui/windows.js';
import StartMenu from './gui/startMenu.js';
import Clock from './gui/clock.js';
import CrtEffectManager from './effects/crtEffectManager.js';
import eventBus from './eventBus.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize components in dependency order
    new Clock('.time', eventBus);
    new Desktop(eventBus);
    new WindowManager(eventBus);
    new StartMenu(eventBus);
    new Taskbar(eventBus);
    new CrtEffectManager(eventBus);
    
    // Store image data temporarily when opening image viewer
    let pendingImageData = null;
    let imageViewerOpenAttempts = 0;
    const MAX_ATTEMPTS = 5;
    
    // Listen for iframe messages
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'iframe-clicked') {
            // Handle window focus requests from iframes
            const windowId = event.data.windowId;
            if (windowId) {
                const targetWindow = document.getElementById(windowId.split('?')[0]); // Remove query params if any
                if (targetWindow) {
                    eventBus.publish('window:focus', { windowId: targetWindow.id });
                }
            }
        } else if (event.data && event.data.type === 'open-image-viewer') {
            // Handle requests to open image viewer with specific image
            pendingImageData = {
                imageName: event.data.imageName,
                imagePath: event.data.imagePath,
                absolutePath: event.data.absolutePath,
                basePath: event.data.basePath
            };
            
            console.log("[Main] Received request to open image viewer with:", pendingImageData);
            imageViewerOpenAttempts = 0;
            
            // Open the image viewer program
            eventBus.publish('program:open', { programName: 'image-viewer' });
        } else if (event.data && event.data.type === 'image-viewer-ready') {
            console.log("[Main] Received ready signal from image viewer");
            
            // If we have pending image data, send it immediately
            if (pendingImageData) {
                console.log("[Main] Sending pending image data to ready viewer");
                const imageViewerWindow = document.getElementById('image-viewer-window');
                if (imageViewerWindow) {
                    const iframe = imageViewerWindow.querySelector('iframe');
                    if (iframe && iframe.contentWindow) {
                        // Send acknowledgment
                        iframe.contentWindow.postMessage({
                            type: 'ready-acknowledged',
                            pendingImagePath: pendingImageData.imagePath
                        }, '*');
                        
                        // Then send the image data
                        sendImageDataToViewer(iframe, pendingImageData);
                    }
                }
            }
        }
    });
    
    // Function to send image data to viewer with retries
    function sendImageDataToViewer(iframe, imageData) {
        if (!iframe || !iframe.contentWindow || !imageData) return;
        
        console.log("[Main] Sending image data to viewer:", imageData);
        
        // Send immediate message
        try {
            iframe.contentWindow.postMessage({
                type: 'load-image',
                ...imageData,
                isMaximized: false
            }, '*');
        } catch (e) {
            console.error("[Main] Error sending image data:", e);
        }
        
        // Also send with delays for redundancy
        setTimeout(() => {
            try {
                iframe.contentWindow.postMessage({
                    type: 'load-image',
                    ...imageData,
                    isMaximized: false,
                    retry: true
                }, '*');
            } catch (e) {
                console.error("[Main] Error in delayed image send:", e);
            }
        }, 100);
        
        // Set up additional retries
        const retryInterval = setInterval(() => {
            imageViewerOpenAttempts++;
            
            if (imageViewerOpenAttempts >= MAX_ATTEMPTS) {
                clearInterval(retryInterval);
                return;
            }
            
            console.log(`[Main] Retry attempt ${imageViewerOpenAttempts} for image:`, imageData.imageName);
            
            try {
                iframe.contentWindow.postMessage({
                    type: 'load-image',
                    ...imageData,
                    isMaximized: false,
                    retry: true,
                    attempt: imageViewerOpenAttempts
                }, '*');
            } catch (e) {
                console.error(`[Main] Error in retry ${imageViewerOpenAttempts}:`, e);
                clearInterval(retryInterval);
            }
        }, 300);
        
        // Clear pending data after max attempts
        setTimeout(() => {
            pendingImageData = null;
        }, 2000);
    }
    
    // Listen for window creation events to pass image data to new image viewer windows
    eventBus.subscribe('window:created', data => {
        if (data.programName === 'image-viewer' && pendingImageData) {
            console.log("[Main] Image viewer window created, preparing to send image data");
            
            // Try immediately 
            const imageViewerWindow = document.getElementById(data.windowId);
            if (imageViewerWindow) {
                const iframe = imageViewerWindow.querySelector('iframe');
                if (iframe) {
                    // Start a set of timed attempts to send the data
                    // First attempt after a very short delay
                    setTimeout(() => {
                        if (iframe.contentWindow) {
                            console.log("[Main] First attempt to send image data");
                            sendImageDataToViewer(iframe, pendingImageData);
                        }
                    }, 50);
                }
            }
        }
    });
    
    // Open Messenger window automatically on load
    setTimeout(() => {
        eventBus.publish('program:open', { programName: 'messenger' });
    }, 100);
});
