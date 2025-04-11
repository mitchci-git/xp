/**
 * Boot sequence and login handling for Windows XP simulation
 */

// This function will be called by main.js after eventBus is ready
function initBootSequence(eventBus, EVENTS) {
    console.log('initBootSequence called.'); // Debug
    // Get elements
    const bootScreen = document.getElementById('boot-screen');
    const loginScreen = document.getElementById('login-screen');
    const desktop = document.querySelector('.desktop');
    // Get CRT effect elements
    const crtScanline = document.querySelector('.crt-scanline');
    const crtVignette = document.querySelector('.crt-vignette');
    const crtGlow = document.querySelector('.crt-glow');
    const loadingProgress = document.querySelector('.loading-progress');
    
    // Check for forceBoot parameter
    const urlParams = new URLSearchParams(window.location.search);
    const forceBoot = urlParams.get('forceBoot') === 'true';

    if (forceBoot) {
        console.log('forceBoot parameter detected. Forcing boot sequence.'); // Debug
        // Clean the URL parameter
        const newUrl = window.location.pathname + window.location.hash;
        history.replaceState({}, document.title, newUrl);
        // Ensure session is cleared just in case
        sessionStorage.removeItem('logged_in'); 
        startBootSequence();
    } else {
        // Original logic: Check if user has already logged in during this session
        const hasLoggedIn = sessionStorage.getItem('logged_in') === 'true';
        console.log('Checking sessionStorage on load. hasLoggedIn:', hasLoggedIn); // Debug
        
        if (hasLoggedIn) {
            // Add extra logging here for the failure case
            // console.error('Force boot parameter was NOT detected, AND hasLoggedIn is true. Skipping boot sequence unexpectedly after shutdown?');
            // Skip boot/login sequence if already logged in
            bootScreen.style.display = 'none';
            loginScreen.style.display = 'none';
            desktop.style.opacity = '1'; // Make desktop visible instantly
            // Restore CRT effects visibility when skipping boot sequence
            console.log('>>> Restoring CRT effects when skipping boot'); // Debug
            if (crtScanline) crtScanline.style.display = 'block'; 
            if (crtVignette) crtVignette.style.display = 'block';
            if (crtGlow) crtGlow.style.display = 'block';
        } else {
            // Start boot sequence
            startBootSequence();
        }
    }
    
    // Boot sequence function
    function startBootSequence() {
        console.log('>>> startBootSequence called'); // Debug: Confirm entry
        // Ensure desktop is hidden
        desktop.style.opacity = '0';
        desktop.style.pointerEvents = 'none'; // Also disable interaction while hidden
        
        // Ensure login screen is hidden initially
        loginScreen.style.display = 'none';
        loginScreen.style.opacity = '0';
        loginScreen.style.pointerEvents = 'none';
        
        // Hide CRT effects during boot
        console.log('>>> Hiding CRT scanline, vignette, and glow for boot'); // Debug
        if (crtScanline) crtScanline.style.display = 'none';
        if (crtVignette) crtVignette.style.display = 'none';
        if (crtGlow) crtGlow.style.display = 'none';
        
        // Make boot screen visible
        console.log('>>> bootScreen element:', bootScreen); // Debug: Check if element exists
        if (!bootScreen) {
            console.error('>>> FATAL: bootScreen element not found!');
            return;
        }
        bootScreen.style.display = 'flex'; // Use flex to show it
        bootScreen.style.opacity = '1';
        bootScreen.style.pointerEvents = 'auto';

        // Force reflow to ensure the display change is rendered
        void bootScreen.offsetWidth;

        // Log applied styles AFTER reflow attempt
        console.log(`>>> bootScreen styles applied: display=${bootScreen.style.display}, opacity=${bootScreen.style.opacity}`);

        // Removed JS animation control for old bar
        /* 
        setTimeout(() => {
            loadingProgress.style.width = '100%';
        }, 10); 
        */
        
        // Wait for boot content visibility duration
        setTimeout(() => {
            console.log('>>> Hiding boot screen content after 5s'); // Debug
            bootScreen.style.display = 'none'; // Hide boot screen content

            // Start a 2-second delay for black screen
            console.log('>>> Starting 2s black screen delay'); // Debug
            setTimeout(() => {
                console.log('>>> Black screen delay ended. Showing login screen.'); // Debug
                // Make login screen take up space and ensure it's transparent
                loginScreen.style.display = 'flex'; 
                loginScreen.style.opacity = '0'; // Explicitly set opacity to 0
                loginScreen.style.pointerEvents = 'auto';

                // Log current opacity before scheduling the change
                console.log(`>>> Login screen opacity BEFORE fade-in trigger: ${loginScreen.style.opacity || getComputedStyle(loginScreen).opacity}`);

                // Trigger fade-in using a minimal delay to ensure reflow
                setTimeout(() => {
                    console.log('>>> Setting login screen opacity to 1 inside final timeout'); // Debug
                    loginScreen.style.opacity = '1';
                }, 50); // Increased delay (50ms) for transition reliability

            }, 1000); // Shortened to 1-second black screen delay

        }, 5000); // 5-second boot screen content visibility duration
    }
    
    // Listen for messages from iframe
    window.addEventListener('message', (event) => {
        // Optional: Add origin check for security
        // if (event.origin !== 'expected-origin') return;
        
        if (event.data && event.data.type === 'loginSuccess') {
            handleLoginSuccess();
        } else if (event.data && event.data.type === 'shutdownRequest') {
            // Handle shutdown requested from login screen by publishing the event
            console.log('Main window: Received shutdownRequest message, publishing SHUTDOWN_REQUESTED event.'); // Debug
            // Removed direct handling:
            // sessionStorage.removeItem('logged_in');
            // window.location.reload(); 
            if (eventBus && EVENTS) {
                eventBus.publish(EVENTS.SHUTDOWN_REQUESTED);
            } else {
                console.error('Cannot publish SHUTDOWN_REQUESTED: eventBus or EVENTS not available.');
                // Fallback or error handling if needed, though they should be available here
            }
        }
    });

    function handleLoginSuccess() {
        // Hide login screen
        loginScreen.style.display = 'none';
        loginScreen.style.pointerEvents = 'none';
        loginScreen.style.opacity = '0';
        
        // Show desktop instantly and re-enable interaction
        desktop.style.opacity = '1';
        desktop.style.pointerEvents = 'auto';

        // Restore CRT effects
        console.log('>>> Restoring CRT scanline, vignette, and glow after login'); // Debug
        if (crtScanline) crtScanline.style.display = 'block'; 
        if (crtVignette) crtVignette.style.display = 'block';
        if (crtGlow) crtGlow.style.display = 'block';

        // Play login sound
        try {
            const loginSound = new Audio('/assets/sounds/login.wav');
            loginSound.play();
            console.log('Login sound played.'); // Debug
        } catch (error) {
            console.error('Error playing login sound:', error); 
        }
        
        // Save login state to session storage
        sessionStorage.setItem('logged_in', 'true');
        console.log('handleLoginSuccess executed. sessionStorage set.'); // Debug
    }

    // Directly set up the log off listener using passed eventBus
    if (!eventBus || !EVENTS) {
        console.error('EventBus or EVENTS not passed to initBootSequence!');
        return;
    }
    
    console.log('Setting up LOG_OFF_REQUESTED listener.'); // Debug
    eventBus.subscribe(EVENTS.LOG_OFF_REQUESTED, () => {
        console.log('LOG_OFF_REQUESTED event received!'); // Debug log
        // Hide desktop
        desktop.style.opacity = '0';
        desktop.style.pointerEvents = 'none';

        // Hide CRT effects when showing login screen after logoff
        console.log('>>> Hiding CRT scanline, vignette, and glow for logoff'); // Debug
        if (crtScanline) crtScanline.style.display = 'none';
        if (crtVignette) crtVignette.style.display = 'none';
        if (crtGlow) crtGlow.style.display = 'none';

        // Reset login iframe state
        const loginIframe = document.getElementById('login-iframe');
        if (loginIframe) {
            loginIframe.src = loginIframe.src;
        }
        
        // Show login screen
        loginScreen.style.display = 'flex';
        loginScreen.style.opacity = '1';
        loginScreen.style.pointerEvents = 'auto';
    });
}

// Export the initialization function
export { initBootSequence }; 