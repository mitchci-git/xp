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
// const loginPassword1 = document.querySelector('.login-password1'); // Removed
// const loginPassword2 = document.querySelector('.login-password2'); // Removed
// const loginBtn1 = document.querySelector('.login-btn1'); // Removed
// const loginBtn2 = document.querySelector('.login-btn2'); // Removed
// const passwordText1 = document.querySelector('.password-text1'); // Removed
// const passwordText2 = document.querySelector('.password-text2'); // Removed

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

// Removed handleLogin function and related listeners
/*
const handleLogin = (passwordInput, correctPassword, passwordText) => {
    // ... removed content ...
};

loginBtn1.addEventListener('click', () => handleLogin(loginPassword1, '1234', passwordText1));
loginBtn2.addEventListener('click', () => handleLogin(loginPassword2, '123', passwordText2));

loginPassword1.addEventListener('keypress', function (event) {
    // ... removed content ...
});
loginPassword2.addEventListener('keypress', function (event) {
    // ... removed content ...
});
*/

// Removed loginSuccess function
/*
const loginSuccess = () => {
    loginSuccessAnimation();
    window.parent.postMessage({ type: 'loginSuccess' }, '*');
};
*/

// Removed loginSuccessAnimation function
/*
const loginSuccessAnimation = () => {
    const left = document.querySelector('.left');
    userProfiles.forEach(profile => {
        if (!profile.classList.contains('active')) {
            profile.style.display = 'none'; 
        }
    });
    left.style.display = 'none';
};
*/
