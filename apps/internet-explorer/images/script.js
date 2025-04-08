const menuBtn = document.querySelector('.menu-btn');
const mainMenu = document.querySelector('.main-menu');
// const themeSwitch = document.getElementById('theme-switch'); // Remove
// const body = document.body; // Remove if only used for theme

// Menu button listener
menuBtn.addEventListener('click', () => {
  mainMenu.classList.toggle('show');
});

// --- Theme Toggle Functionality Removed ---
/*
// Check for saved theme preference or use system preference
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Apply initial theme
if (savedTheme === 'light' || (!savedTheme && !prefersDark)) {
  body.classList.add('light-mode');
} else {
  body.classList.remove('light-mode'); 
}

// Theme switch button listener
if (themeSwitch) {
  themeSwitch.addEventListener('click', () => {
    body.classList.toggle('light-mode');
    const currentTheme = body.classList.contains('light-mode') ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
    console.log('Theme toggled. Current theme:', currentTheme);
  });
} else {
  console.warn('Theme switch button not found.');
}
*/

// --- End Theme Toggle ---

// --- Add Logo Click Handler ---
const logoLink = document.querySelector('.main-nav .logo');
if (logoLink) {
  logoLink.style.cursor = 'pointer'; // Add pointer cursor
  logoLink.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent potential default image actions
    const targetProjectId = 'retro-os'; // ID of the main portfolio tab
    console.log(`Logo clicked: Requesting tab for projectId: ${targetProjectId}`);
    
    // Send message to PARENT (Projects App)
    if (window.parent && window.parent !== window) { 
      window.parent.postMessage({ type: 'openTabWithContent', projectId: targetProjectId }, '*'); 
      console.log(`Sent 'openTabWithContent' message to parent for projectId: ${targetProjectId}`);
    } else {
      console.warn('Could not send message: not running inside an iframe or parent not accessible.');
    }
  });
} else {
  console.warn('Logo element not found for click listener.');
}

// --- Add Nav Link Click Handler ---
const navLinks = {
  'Video': 'video-tab',
  'Images': 'images-tab',
  'Code': 'code-tab'
};

document.querySelectorAll('.main-nav ul.main-menu li a').forEach(link => {
  const linkText = link.textContent;
  if (navLinks[linkText]) { // Check if the link text matches our keys
    const targetProjectId = navLinks[linkText];
    
    link.addEventListener('click', (event) => {
      event.preventDefault(); // Prevent default link navigation
      console.log(`Nav link clicked: Requesting tab for projectId: ${targetProjectId}`);
      
      // Send message to PARENT (Projects App) to open the corresponding tab
      if (window.parent && window.parent !== window) { 
        window.parent.postMessage({ type: 'openTabWithContent', projectId: targetProjectId }, '*'); 
        console.log(`Sent 'openTabWithContent' message to parent for projectId: ${targetProjectId}`);
      } else {
        console.warn('Could not send message: not running inside an iframe or parent not accessible.');
        // Optionally, provide a fallback for when not embedded
        // alert(`Cannot open tab: Simulation environment not detected.`);
      }
    });
  }
}); 

// --- Lightbox Functionality REMOVED ---