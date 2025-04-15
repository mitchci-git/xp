// Login Screen Logic
// Variable to track if login is in cooldown period
let loginCooldown = false;  // Start with NO cooldown by default

// Check if this is being loaded after a log off (via URL parameter)
const urlParams = new URLSearchParams(window.location.search);
const isLogOff = urlParams.get('logoff') === 'true';
const isInitial = urlParams.get('initial') === 'true';

// Only activate cooldown if this is loaded after a log off
if (isLogOff) {
    loginCooldown = true;
    console.log('Login cooldown activated due to log off');
} else {
    // If it's the initial load (not logoff), log that
    console.log('Initial login cooldown activated');
}

const userProfiles = document.querySelectorAll('.back-gradient'); // Now selects only one

userProfiles.forEach((profileElement) => {
    // No need to remove 'active' from others if there's only one
    profileElement.addEventListener('click', function () {
        // Check if login is in cooldown period
        if (loginCooldown) {
            console.log('Login prevented: cooldown period active');
            return;
        }
        
        // Add .active to the clicked profile (even if redundant, keeps logic consistent)
        profileElement.classList.add('active');
        
        // Trigger login immediately by sending message to parent
        console.log('Login screen: User profile clicked. Sending loginSuccess.'); // Debug
        window.parent.postMessage({ type: 'loginSuccess' }, '*');
    });
});

// Wait for the login screen's DOM to be ready before adding listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('Login screen: DOMContentLoaded fired.'); // Debug
    const shutdownIcon = document.getElementById('shutdown-icon');
    if (shutdownIcon) {
        console.log('Login screen: Found shutdown icon, adding listener.'); // Debug
        shutdownIcon.addEventListener('click', () => {
            // Send shutdown request to parent window
            console.log('Login screen: Shutdown icon clicked.');
            console.log('Login screen: Sending shutdownRequest message...');
            window.parent.postMessage({ type: 'shutdownRequest' }, '*'); 
            console.log('Login screen: shutdownRequest message sent.');
        });
    } else {
        console.error('Login screen: Could not find shutdown icon!'); // Debug
    }
    
    // Only set a timeout to remove the login cooldown if it's active (due to logoff or initial)
    if (loginCooldown) {
        const cooldownDuration = 2000; // Changed to 2 seconds
        console.log(`Setting login cooldown timeout: ${cooldownDuration}ms`); // Log the new duration
        setTimeout(() => {
            loginCooldown = false;
            console.log('Login cooldown period ended');
        }, cooldownDuration); 
    }
});
