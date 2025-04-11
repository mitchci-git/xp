/**
 * Iframe communication utilities to manage interactions between
 * iframe applications and the parent window in the XP simulation
 */

// Notify parent when iframe is clicked (for focus management)
document.addEventListener('click', () => 
    window.parent && window.parent !== window && 
    window.parent.postMessage({ type: 'iframe-clicked' }, '*')
);

/**
 * Sets up focus tracking for iframes to help manage window activation state
 * Uses periodic checks instead of focus/blur events since iframe boundary
 * event propagation can be unreliable across browsers
 */
export function setupIframeActivation() {
    if (!window.parent || window.parent === window) return;

    let lastFocusState = document.hasFocus();
    
    setInterval(() => {
        const hasFocus = document.hasFocus();
        if (hasFocus === lastFocusState) return;
        
        lastFocusState = hasFocus;
        window.parent.postMessage({ 
            type: hasFocus ? 'iframe-focused' : 'iframe-blurred' 
        }, '*');
    }, 150);
}
