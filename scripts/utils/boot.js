/**
 * @fileoverview Boot sequence and login handling for Windows XP simulation
 * 
 * This module manages the boot animation sequence, login process, and session handling
 * for the Windows XP simulation. It controls transitions between boot screen, login
 * screen, and desktop, and handles session persistence.
 * 
 * @module boot
 */

/**
 * Initializes the boot sequence for the Windows XP simulation
 * 
 * @param {Object} eventBus - Event bus instance for pub/sub communication
 * @param {Object} EVENTS - Event name constants
 * @returns {void}
 */
export function initBootSequence(eventBus, EVENTS) {
    // DOM element references
    const bootScreen = document.getElementById('boot-screen');
    const loginScreen = document.getElementById('login-screen');
    const desktop = document.querySelector('.desktop');
    
    // CRT effect elements
    const crtScanline = document.querySelector('.crt-scanline');
    const crtVignette = document.querySelector('.crt-vignette');
    const crtGlow = document.querySelector('.crt-glow');
    
    // Check URL parameters for boot control
    const urlParams = new URLSearchParams(window.location.search);
    const forceBoot = urlParams.get('forceBoot') === 'true';

    if (forceBoot) {
        // Handle forced boot sequence (triggered by shutdown)
        // Clean URL to remove parameter
        const newUrl = window.location.pathname + window.location.hash;
        history.replaceState({}, document.title, newUrl);
        
        // Reset session state
        sessionStorage.removeItem('logged_in'); 
        startBootSequence();
    } else {
        // Check existing session state
        const hasLoggedIn = sessionStorage.getItem('logged_in') === 'true';
        
        if (hasLoggedIn) {
            // Skip boot/login sequence if already logged in this session
            skipBootSequence();
        } else {
            // Start normal boot sequence for new session
            startBootSequence();
        }
    }
    
    /**
     * Bypasses boot sequence for returning users
     * @private
     */
    function skipBootSequence() {
        // Hide boot and login screens
        bootScreen.style.display = 'none';
        loginScreen.style.display = 'none';
        
        // Show desktop immediately
        desktop.style.opacity = '1';
        desktop.style.pointerEvents = 'auto';
        
        // CRT effects remain visible by default CSS
        if (crtGlow) crtGlow.style.display = 'block';
    }
    
    /**
     * Executes the full boot animation sequence
     * @private
     */
    function startBootSequence() {
        // Ensure desktop is hidden during boot
        desktop.style.opacity = '0';
        desktop.style.pointerEvents = 'none';
        
        // Ensure login screen is initially hidden
        loginScreen.style.display = 'none';
        loginScreen.style.opacity = '0';
        loginScreen.style.pointerEvents = 'none';
        
        // Hide CRT effects during boot animation
        if (crtScanline) crtScanline.style.display = 'none';
        if (crtVignette) crtVignette.style.display = 'none';
        if (crtGlow) crtGlow.style.display = 'none';
        
        // Activate boot screen
        if (!bootScreen) {
            console.error('FATAL: Boot screen element not found');
            return;
        }
        
        bootScreen.style.display = 'flex';
        bootScreen.style.opacity = '1';
        bootScreen.style.pointerEvents = 'auto';

        // Force reflow to ensure display changes are applied
        void bootScreen.offsetWidth;
        
        // ANIMATION SEQUENCE TIMINGS:
        // 1. Boot screen visible for 5 seconds
        // 2. Black screen transition for 1 second
        // 3. Login screen fade-in
        
        // Stage 1: Boot screen animation (5s)
        setTimeout(() => {
            bootScreen.style.display = 'none';

            // Stage 2: Black screen transition (1s)
            setTimeout(() => {
                // Stage 3: Login screen fade-in
                // Make login screen visible but transparent initially
                loginScreen.style.display = 'flex'; 
                loginScreen.style.opacity = '0';
                loginScreen.style.pointerEvents = 'auto';

                // Small delay ensures display change is processed before opacity transition
                setTimeout(() => {
                    loginScreen.style.opacity = '1';
                }, 50);
            }, 1000);
        }, 5000);
    }
    
    /**
     * Handle successful login from login iframe
     * @private
     */
    function handleLoginSuccess() {
        // Hide login screen
        loginScreen.style.display = 'none';
        loginScreen.style.pointerEvents = 'none';
        loginScreen.style.opacity = '0';
        
        // Show desktop and enable interaction
        desktop.style.opacity = '1';
        desktop.style.pointerEvents = 'auto';

        // Restore CRT effects after login
        if (crtScanline) crtScanline.style.display = 'block'; 
        if (crtVignette) crtVignette.style.display = 'block';
        if (crtGlow) crtGlow.style.display = 'block';

        // Trigger a custom event to reinitialize scanline animation
        document.dispatchEvent(new CustomEvent('reinitScanline'));

        // Play login sound
        try {
            const loginSound = new Audio('./assets/sounds/login.wav');
            loginSound.play();
        } catch (error) {
            console.error('Error playing login sound:', error); 
        }
        
        // Persist login state for this session
        sessionStorage.setItem('logged_in', 'true');
    }

    // Event listener for communication with login iframe
    window.addEventListener('message', (event) => {
        // Security note: Consider adding origin validation in production
        // if (event.origin !== window.origin) return;
        
        if (event.data?.type === 'loginSuccess') {
            handleLoginSuccess();
        } else if (event.data?.type === 'shutdownRequest') {
            // Propagate shutdown request to main event system
            if (eventBus && EVENTS) {
                eventBus.publish(EVENTS.SHUTDOWN_REQUESTED);
            } else {
                console.error('Cannot publish shutdown event: event system unavailable');
            }
        }
    });

    // Set up log off event handler
    if (!eventBus || !EVENTS) {
        console.error('Event system not available for boot sequence');
        return;
    }
    
    /**
     * Handle log off request
     * Shows login screen without full reboot
     */
    eventBus.subscribe(EVENTS.LOG_OFF_REQUESTED, () => {
        // Hide desktop during log off
        desktop.style.opacity = '0';
        desktop.style.pointerEvents = 'none';

        // Hide CRT effects during login screen
        if (crtScanline) crtScanline.style.display = 'none';
        if (crtVignette) crtVignette.style.display = 'none';
        if (crtGlow) crtGlow.style.display = 'none';

        // Play logoff sound
        try {
            const logoffSound = new Audio('./assets/sounds/logoff.wav');
            logoffSound.play();
        } catch (error) {
            console.error('Error playing logoff sound:', error); 
        }

        // Reset login iframe to clear state
        const loginIframe = document.getElementById('login-iframe');
        if (loginIframe) {
            loginIframe.src = loginIframe.src;
        }
        
        // Show login screen
        loginScreen.style.display = 'flex';
        loginScreen.style.opacity = '1';
        loginScreen.style.pointerEvents = 'auto';
        
        // Keep session storage intact but flag Windows as logged out
        // This lets us distinguish between full boot and log-off state
        sessionStorage.setItem('logged_in', 'false');
    });
} 