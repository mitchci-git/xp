import { setupIframeActivation } from '../../scripts/utils/iframeManager.js';

document.addEventListener('DOMContentLoaded', () => {
    setupIframeActivation();

    // --- Removed Project Data & Tab Variables ---

    const projectFrame = document.getElementById('project-frame');
    const addressInput = document.getElementById('address-input'); // Get address bar

    // --- Removed Tab Management Functions ---

    // --- Update Message Listener (Keep only essential parts if needed) ---
    window.addEventListener('message', (event) => {
        // Origin Check is still good practice
        if (event.origin !== window.origin) {
            return; 
        }

        // Logic to handle clicks inside the loaded project asking to open a NEW window/program
        if (event.source === window.parent) { // This check is actually for PARENT -> IFRAME
            // Keep this if the parent might send messages TO this iframe
        } else { // Message likely coming FROM the iframe (projecthub)
            // Keep only the part that handles opening NEW windows, remove tab logic
            if (event.data?.type === 'openProject' && event.data.id) {
                const windowIdParam = new URLSearchParams(window.location.search).get('windowId');
                window.parent.postMessage({
                    type: 'openProject',
                    id: event.data.id,
                    sourceWindowId: windowIdParam
                }, window.origin);
            }
        }
    });

    // --- Initialization ---
    function initializeApp() {
        const initialPath = 'projecthub/index.html';
        projectFrame.src = initialPath;
        if (addressInput) { 
             addressInput.value = `portfolio://ProjectHub/`; // Update address bar
        }
    }

    initializeApp();

}); 