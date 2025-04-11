/**
 * Windows XP Simulation Main Script
 * Entry point for the application that initializes all components
 */
import Desktop from './gui/desktopManager.js';
import Taskbar from './gui/taskbarManager.js';
import WindowManager from './gui/windowManager.js';
import { eventBus, EVENTS } from './utils/eventBus.js';
import programData from './utils/programRegistry.js';
import { initBootSequence } from './boot.js'; // Import the boot sequence initializer

document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    new Taskbar(eventBus);
    new Desktop(eventBus);
    new WindowManager(eventBus);

    // Initialize the boot/login sequence AFTER eventBus is ready
    initBootSequence(eventBus, EVENTS);

    // Subscribe to shutdown event
    console.log('Setting up SHUTDOWN_REQUESTED listener.'); // Debug
    eventBus.subscribe(EVENTS.SHUTDOWN_REQUESTED, () => {
        console.log('SHUTDOWN_REQUESTED event received in main.js!'); // Debug
        sessionStorage.removeItem('logged_in');
        // Navigate with a parameter to force boot sequence on reload
        const currentPath = window.location.pathname;
        window.location.assign(currentPath + '?forceBoot=true');
    });

    // Handle iframe messages
    window.addEventListener('message', ({ data }) => {
        // Handle focus message from iframe click
        if (data?.type === EVENTS.IFRAME_CLICKED)
            eventBus.publish(EVENTS.WINDOW_FOCUSED, { windowId: null });
        
        // Handle Project Hub message to open a new project tab
        if (data?.type !== 'openProject') return;
            
        // Map hub ID to the specific detail program name
        const programMap = { 'retro-os': 'retro-os-details' };
        const detailProgramName = programMap[data.id];
            
        if (!detailProgramName) {
            console.warn(`Hub requested unknown project ID: ${data.id}`);
            return;
        }

        eventBus.publish(EVENTS.PROGRAM_OPEN, { programName: detailProgramName });
    });
    
    // Initialize CRT scanline with random intervals
    initRandomScanline();
});

// CRT scanline effect with random timing
function initRandomScanline() {
    const scanline = document.querySelector('.crt-scanline');
    if (!scanline) return; // Exit if scanline element isn't found
    
    // Add event listener for when the transition ends
    scanline.addEventListener('transitionend', () => {
        // When transition ends, hide the scanline and prepare for next animation
        scanline.style.transition = 'none';
        scanline.style.transform = 'translateY(-10px)';
        
        // Random interval before next scan (1-3 seconds)
        const nextInterval = 1000 + Math.random() * 2000;
        
        // Schedule the next animation
        setTimeout(startAnimation, nextInterval);
    });
    
    // Function to start a new scanline animation
    function startAnimation() {
        // Force reflow to ensure the reset position took effect
        void scanline.offsetWidth;
        
        // Random animation duration (4-7 seconds)
        const duration = 4000 + Math.random() * 3000;
        
        // Set the transition duration and start animation
        scanline.style.transition = `transform ${duration}ms linear`;
        scanline.style.transform = 'translateY(100vh)';
    }
    
    // Start the initial animation after a short delay
    setTimeout(startAnimation, 500);
}
