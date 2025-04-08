import { setupIframeActivation } from '../../scripts/utils/iframeComm.js';

// REMOVE listener
// document.addEventListener('mousedown', () => { ... }, true);

document.addEventListener('DOMContentLoaded', () => {
    setupIframeActivation();

    // --- Project Data ---
    // Include entries for the main hub and its detail page
    const projects = [
        {
            id: 'retro-os', // ID now matches the content/concept
            title: 'Project Hub', // Changed from Retro OS Portfolio
            htmlPath: 'projecthub/index.html', // Updated from project1 to projecthub
            isClosable: false,
            isDetail: false
        },
        // Removed project2 entry
        // New entries for the content tabs
        {
            id: 'video-tab',
            title: 'Videos',
            htmlPath: 'videos/index.html',
            isClosable: true,
            isDetail: false // Or true depending on context?
        },
        {
            id: 'images-tab',
            title: 'Image Gallery',
            htmlPath: 'images/index.html',
            isClosable: true,
            isDetail: false
        },
        {
            id: 'code-tab',
            title: 'Code Repos',
            htmlPath: 'code/index.html',
            isClosable: true,
            isDetail: false
        }
    ];

    const tabBarContainer = document.querySelector('.dynamic-tabs-container');
    const projectFrame = document.getElementById('project-frame');
    const addressInput = document.getElementById('address-input'); // Get address bar

    let activeTabId = null;

    // --- Tab Management Functions ---

    function createTabButton(project) {
        const tabButton = document.createElement('button');
        tabButton.className = 'tab-button';
        tabButton.dataset.projectId = project.id;

        const titleSpan = document.createElement('span');
        titleSpan.textContent = project.title;
        tabButton.appendChild(titleSpan);

        if (project.isClosable !== false) { // Add close button unless explicitly false
            const closeButton = document.createElement('button');
            closeButton.className = 'tab-close-button';
            closeButton.innerHTML = '&times;'; // Simple 'x'
            closeButton.title = 'Close Tab';
            closeButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent tab switch when clicking close
                closeTab(project.id);
            });
            tabButton.appendChild(closeButton);
        }

        tabButton.addEventListener('click', () => openOrSwitchToTab(project.id));
        return tabButton;
    }

    function switchTab(projectId) {
        const project = projects.find(p => p.id === projectId);
        if (!project) {
            console.error('Project data not found for switchTab:', projectId);
            projectFrame.src = 'about:blank';
            if (addressInput) addressInput.value = '';
            activeTabId = null;
            // Deactivate all tabs if project is invalid
             document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            return;
        }

        // Deactivate all tabs visually
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));

        // Activate selected tab visually
        const activeTab = document.querySelector(`.tab-button[data-project-id="${projectId}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
            activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }

        // Load project page into iframe
        projectFrame.src = project.htmlPath;
        if (addressInput) { // Update address bar
             addressInput.value = `portfolio://${project.title.replace(/\s+/g, '')}/`;
        }
        activeTabId = projectId;
        console.log(`Switched to tab: ${projectId}, loaded: ${project.htmlPath}`);
    }

    function openOrSwitchToTab(projectId) {
        let tabExists = document.querySelector(`.tab-button[data-project-id="${projectId}"]`);

        if (tabExists) {
            console.log(`Tab already exists for ${projectId}. Switching.`);
            switchTab(projectId);
        } else {
            console.log(`Tab does not exist for ${projectId}. Creating.`);
            const project = projects.find(p => p.id === projectId);
            if (project) {
                const newTabButton = createTabButton(project);
                tabBarContainer.appendChild(newTabButton);
                switchTab(projectId); // Switch to the newly created tab
            } else {
                console.error(`Cannot create tab: Project data not found for ID ${projectId}`);
            }
        }
    }

     function closeTab(projectId) {
        console.log(`Attempting to close tab: ${projectId}`);
        const tabToClose = document.querySelector(`.tab-button[data-project-id="${projectId}"]`);
        if (tabToClose) {
            tabBarContainer.removeChild(tabToClose);
            console.log(`Removed tab element for: ${projectId}`);

            // If the closed tab was the active one, switch to another tab
            if (activeTabId === projectId) {
                 activeTabId = null; // Reset active id
                // Try switching to the first remaining tab
                const firstTab = tabBarContainer.querySelector('.tab-button');
                if (firstTab) {
                    const firstTabId = firstTab.dataset.projectId;
                    console.log(`Closed active tab. Switching to first remaining: ${firstTabId}`);
                    openOrSwitchToTab(firstTabId);
                } else {
                    // No tabs left
                    console.log("Closed last tab. Clearing frame.");
                    projectFrame.src = 'about:blank';
                     if (addressInput) addressInput.value = '';
                }
            }
        } else {
             console.warn(`Could not find tab element to close for ID: ${projectId}`);
        }
    }

    // --- Message Listener ---
    window.addEventListener('message', (event) => {
        if (event.source !== projectFrame.contentWindow) {
             return; // Ignore messages not from our iframe
        }

        if (event.data?.type === 'openTabWithContent' && event.data.projectId) {
            const receivedProjectId = event.data.projectId; 
            console.log(`Received 'openTabWithContent' request for projectId: ${receivedProjectId}`);
            
            let targetTabId = null;

            // Special case: If the request is specifically for 'retro-os', always target that tab directly.
            if (receivedProjectId === 'retro-os') {
                targetTabId = 'retro-os';
                console.log(`Special case: Targeting 'retro-os' tab directly.`);
            } else {
                // Case 2: Assume the received ID is the actual tab to open
                // Check if this ID exists directly in our projects list
                if (projects.some(p => p.id === receivedProjectId)) {
                    targetTabId = receivedProjectId;
                    console.log(`Using received ID directly as target tab ID: ${targetTabId}`);
                } else {
                     console.error(`Cannot open tab: No project found with id matching '${receivedProjectId}'.`); // Simplified error
                }
            }

            // If we found a valid target tab ID, open or switch to it
            if (targetTabId) {
                openOrSwitchToTab(targetTabId);
            } 
        }
    });


    // --- Initialization ---
    function initializeProjects() {
        tabBarContainer.innerHTML = '';

        // Find the initial project ('retro-os')
        const initialProject = projects.find(p => !p.isDetail && p.id === 'retro-os'); 

        if (initialProject) {
             console.log(`Initializing with project: ${initialProject.id}`);
             openOrSwitchToTab(initialProject.id); // Create and switch to the initial tab
        } else {
            console.warn('Initial project not found in data.');
            projectFrame.src = 'about:blank'; // Clear frame if no initial project
             if (addressInput) addressInput.value = '';
        }
    }

    initializeProjects();

}); 