document.addEventListener("DOMContentLoaded", () => {
  console.log('Projects Hub script loaded.');

  // Initialize GSAP
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  // Theme toggle functionality
  const themeSwitch = document.getElementById("theme-switch");
  const body = document.body;

  // Check for saved theme preference or use preferred color scheme
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (savedTheme === "light" || (!savedTheme && !prefersDark)) {
    body.classList.add("light-mode");
  }

  if (themeSwitch) {
    themeSwitch.addEventListener("click", () => {
      body.classList.toggle("light-mode");
      const currentTheme = body.classList.contains("light-mode")
        ? "light"
        : "dark";
      localStorage.setItem("theme", currentTheme);
      console.log('Theme toggled. Current theme:', localStorage.getItem('theme') || 'dark');
    });
  } else {
    console.warn('Theme switch button not found.');
  }

  // GSAP Animations
  // Section animations (now only applies to the #projects section)
  const sections = document.querySelectorAll("main > section");

  sections.forEach((section) => {
    gsap.from(section.querySelector(".section-header"), {
      y: 50,
      opacity: 0,
      duration: 0.8,
      scrollTrigger: {
        trigger: section,
        start: "top 80%",
        toggleActions: "play none none none"
      }
    });

    // Target project items specifically
    const projectItems = section.querySelectorAll(".work-item"); 
    gsap.from(projectItems, {
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      scrollTrigger: {
        trigger: section, 
        start: "top 70%", 
        toggleActions: "play none none none"
      }
    });
  });

  // --- Add Project Link Click Handler (Placeholder) ---
  const projectLinks = document.querySelectorAll('.work-link[data-project-target]');
  projectLinks.forEach(link => {
      link.addEventListener('click', (event) => {
          event.preventDefault();
          const projectId = link.dataset.projectTarget;
          console.log(`Project link clicked: Target = ${projectId}`);
          
          // **IMPORTANT:** The actual logic to open a new tab/window
          // needs to be handled by the PARENT window (the main OS simulation)
          // listening for a message or event from this iframe.
          // Example: window.parent.postMessage({ type: 'openProject', id: projectId }, '*');
          
          // Provide feedback within the hub page (optional)
          alert(`Request to open project: ${projectId}. (Requires main OS integration)`);
      });
  });
});
