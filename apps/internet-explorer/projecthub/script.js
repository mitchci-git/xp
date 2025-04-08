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

// --- Add Project Link Click Handler ---
// Target ONLY links within .home-cards for tab switching
const projectLinks = document.querySelectorAll('.home-cards a[data-project-target]');
projectLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        const projectIdToSend = link.dataset.projectTarget;
        if (!projectIdToSend) {
            console.error("Clicked link is missing data-project-target attribute.");
            return;
        }
        console.log(`Home card link clicked: Requesting tab for project ID: ${projectIdToSend}`);
        
        // Send message to PARENT (Projects App) to open the corresponding tab
        if (window.parent && window.parent !== window) { 
          window.parent.postMessage({ type: 'openTabWithContent', projectId: projectIdToSend }, '*'); 
          console.log(`Sent 'openTabWithContent' message to parent for target tab ID: ${projectIdToSend}`);
        } else {
          console.warn('Could not send message: not running inside an iframe or parent not accessible.');
          alert(`Cannot open project: Simulation environment not detected.`);
        }
    });
}); 

// --- Add Nav Link Click Handlers ---
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

// --- New Lightbox Functionality (In-Flow) ---
const showcaseViewDetailsButton = document.querySelector('.showcase .btn'); 
const mainContainer = document.getElementById('main-content-container'); // Use the new ID
let lightboxCloseButton = null; 
// Gallery variables removed

function setupLightboxListeners() {
  const lightboxElement = document.getElementById('project-lightbox');
  if (!lightboxElement) return;
  
  // Close button
  lightboxCloseButton = lightboxElement.querySelector('.lightbox-close');
  if (lightboxCloseButton) {
    lightboxCloseButton.addEventListener('click', closeInFlowLightbox);
  } else {
    console.warn('Lightbox close button not found inside #project-lightbox.')
  }

  // Gallery setup removed
}

function openInFlowLightbox(event) {
  event.preventDefault(); 
  console.log('Opening in-flow lightbox...');
  if (mainContainer) {
    mainContainer.classList.add('lightbox-active');
    // Gallery reset logic removed
  } else {
    console.error('Main container not found for lightbox activation.');
  }
}

function closeInFlowLightbox() {
  console.log('Closing in-flow lightbox...');
  if (mainContainer) {
    mainContainer.classList.remove('lightbox-active');
  }
}

// Add event listener to the Showcase View Details button
if (showcaseViewDetailsButton) {
  showcaseViewDetailsButton.addEventListener('click', openInFlowLightbox);
} else {
  console.warn('Showcase "View Details" button not found.');
}

// Re-enable call
setupLightboxListeners();

// --- Lightbox Functionality Removed ---