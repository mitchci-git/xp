/**
 * Windows XP Simulation Main Script
 * 
 * @description Entry point for the Windows XP simulation that initializes all core components
 * and sets up event handling. This file orchestrates the application's lifecycle.
 * 
 * @module main
 */
import Desktop from './gui/desktopManager.js';
import Taskbar from './gui/taskbarManager.js';
import WindowManager from './gui/windowManager.js';
import { eventBus, EVENTS } from './utils/eventBus.js';
import programData from './utils/programRegistry.js';
import { initBootSequence } from './utils/boot.js'; // Import the boot sequence initializer
import { preloadIframes } from './utils/iframePreloader.js'; // Import preloader

document.addEventListener('DOMContentLoaded', () => {
    // Initialize core UI components with shared event bus for communication
    new Taskbar(eventBus);
    new Desktop(eventBus);
    new WindowManager(eventBus);

    // Initialize boot/login sequence after component initialization
    // IMPORTANT: Must be called after eventBus initialization
    initBootSequence(eventBus, EVENTS);

    // Start preloading application iframes with slight delay
    // NOTE: Delay prevents competing with critical rendering tasks
    setTimeout(preloadIframes, 100); 

    // Handle system shutdown requests
    // FIXME: Consider adding confirmation dialog before shutdown
    console.log('Setting up SHUTDOWN_REQUESTED listener.'); // Debug
    eventBus.subscribe(EVENTS.SHUTDOWN_REQUESTED, () => {
        console.log('SHUTDOWN_REQUESTED event received in main.js!'); // Debug
        sessionStorage.removeItem('logged_in');
        // Navigate with a parameter to force boot sequence on reload
        const currentPath = window.location.pathname;
        window.location.assign(currentPath + '?forceBoot=true');
    });

    // Handle cross-iframe communication
    window.addEventListener('message', ({ data }) => {
        // Propagate focus events from iframes to parent window manager
        if (data?.type === EVENTS.IFRAME_CLICKED) {
            eventBus.publish(EVENTS.WINDOW_FOCUSED, { windowId: null });
        }
        
        // Handle project navigation from Project Hub
        // TODO: Extract this to a dedicated handler if more projects are added
        if (data?.type !== 'openProject') return;
            
        // Map project IDs to their detail view program names
        const programMap = { 'retro-os': 'retro-os-details' };
        const detailProgramName = programMap[data.id];
            
        if (!detailProgramName) {
            console.warn(`Hub requested unknown project ID: ${data.id}`);
            return;
        }

        eventBus.publish(EVENTS.PROGRAM_OPEN, { programName: detailProgramName });
    });
    
    // Initialize CRT visual effects
    initRandomScanline();
    initGlowEffect();
});

/**
 * Initializes and manages the moving scanline CRT effect
 * 
 * @description Creates a randomly timed animation of a scanline moving vertically
 * across the screen to simulate a CRT monitor effect. Uses CSS transitions with
 * random timing for natural variation.
 * 
 * @returns {void}
 */
function initRandomScanline() {
    const scanline = document.querySelector('.crt-scanline');
    if (!scanline) return; // Graceful exit if element doesn't exist
    
    let isAnimationStarted = false;
    
    // Handle transition completion and schedule next animation
    scanline.addEventListener('transitionend', () => {
        // Reset scanline position without animation
        scanline.style.transition = 'none';
        scanline.style.transform = 'translateY(-10px)';
        
        // Random delay between animations (1-3 seconds)
        // PERF: Longer intervals reduce visual processing overhead
        const nextInterval = 1000 + Math.random() * 2000;
        setTimeout(startAnimation, nextInterval);
    });
    
    /**
     * Begins a new scanline animation cycle
     * @private
     */
    function startAnimation() {
        // Force browser reflow to ensure position reset is applied
        // This prevents transition glitches between animation cycles
        void scanline.offsetWidth;
        
        // Random duration creates natural variation (4-7 seconds)
        const duration = 4000 + Math.random() * 3000;
        
        // Apply the animation with dynamic duration
        scanline.style.transition = `transform ${duration}ms linear`;
        scanline.style.transform = 'translateY(100vh)';
        
        isAnimationStarted = true;
    }
    
    // Start animation on first desktop click
    document.querySelector('.desktop').addEventListener('click', () => {
        if (!isAnimationStarted) {
            startAnimation();
        }
    }, { once: true });
    
    // Listen for login success and reinitialize animation
    document.addEventListener('reinitScanline', () => {
        // Start the animation after a brief delay
        setTimeout(startAnimation, 500);
    });
    
    // For page refreshes when already on desktop
    if (sessionStorage.getItem('logged_in') === 'true') {
        // Begin the initial animation cycle after short delay
        // This allows initial page render to complete first
        setTimeout(startAnimation, 500);
    }
}

/**
 * Initializes and manages the glow effect
 * 
 * @description Ensures the CRT glow effect is properly displayed
 * on the desktop but hidden during boot sequence
 */
function initGlowEffect() {
    const glowElement = document.querySelector('.crt-glow');
    if (!glowElement) return; // Exit if element doesn't exist
    
    let isGlowActive = false;
    
    // Activate glow on first desktop click
    document.querySelector('.desktop').addEventListener('click', () => {
        if (!isGlowActive) {
            glowElement.style.display = 'block';
            isGlowActive = true;
        }
    }, { once: true });
    
    // Listen for login success to ensure glow is active
    document.addEventListener('reinitScanline', () => {
        glowElement.style.display = 'block';
        isGlowActive = true;
    });
    
    // For page refreshes when already on desktop
    if (sessionStorage.getItem('logged_in') === 'true') {
        glowElement.style.display = 'block';
        isGlowActive = true;
    }
}
