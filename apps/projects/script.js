import { setupIframeActivation } from '../../scripts/utils/iframeComm.js';

document.addEventListener('DOMContentLoaded', () => {
    setupIframeActivation();

    // --- Project Data --- 
    // Update this array with your project details.
    // htmlPath should point to the index.html for each project's mini-site.
    const projects = [
        {
            id: 'project1',
            title: 'Retro OS Portfolio', 
            htmlPath: 'project1/index.html' // Path to the project's page
        },
        {
            id: 'project2',
            title: 'Graphic Design Showcase',
            htmlPath: 'project2/index.html' 
        },
        {
            id: 'project3',
            title: 'Web App Development',
            htmlPath: 'project3/index.html' 
        }
        // Add more project objects here
    ];

    const tabBarContainer = document.querySelector('.dynamic-tabs-container'); 
    // const contentArea = document.querySelector('.content-area'); // No longer needed directly
    const projectFrame = document.getElementById('project-frame'); // Get the iframe

    function switchTab(projectId) {
        // Deactivate all tabs 
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        
        // Find the project data
        const project = projects.find(p => p.id === projectId);
        if (!project) {
            console.error('Project data not found for:', projectId);
            projectFrame.src = 'about:blank'; // Clear frame on error
            return;
        }

        // Activate selected tab 
        const activeTab = document.querySelector(`.tab-button[data-project-id="${projectId}"]`);
        if (activeTab) activeTab.classList.add('active');

        // Load project page into iframe
        projectFrame.src = project.htmlPath;
        
        // Scroll tab into view if needed 
        activeTab?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }

    function initializeProjects() {
        tabBarContainer.innerHTML = ''; // Clear example tabs
        // contentArea.innerHTML = ''; // No longer needed

        if (projects.length === 0) {
            // Display message maybe in the iframe or a dedicated element if needed
            projectFrame.src = 'data:text/html,<p>No projects to display yet.</p>';
            return;
        }

        projects.forEach((project, index) => {
            // Create Tab Button (same as before)
            const tabButton = document.createElement('button');
            tabButton.className = 'tab-button';
            tabButton.dataset.projectId = project.id;
            tabButton.innerHTML = `<span>${project.title}</span>`;
            tabButton.addEventListener('click', () => switchTab(project.id));
            tabBarContainer.appendChild(tabButton);

            // *** Remove code that created .project-content divs ***

            // Activate the first tab and load its content by default
            if (index === 0) {
                switchTab(project.id); // This will load the first project's htmlPath
            }
        });
    }

    // --- Initialization ---
    initializeProjects();

}); 