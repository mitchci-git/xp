/**
 * Communication utilities for iframe applications
 * Handles message passing between iframes and parent window
 */

/**
 * Sets up click events to activate parent window when iframe content is clicked
 * @returns {boolean} True if successfully set up
 */
export function setupIframeActivation() {
    if (!window.parent || window.parent === window) {
        // Not in an iframe
        return false;
    }
    
    // Add click handler to activate parent window
    document.addEventListener('mousedown', () => {
        window.parent.postMessage({
            type: 'iframe-clicked',
            windowId: null,
            timestamp: Date.now()
        }, '*');
    }, true); // Use capture phase for earliest handling
    
    return true;
}
