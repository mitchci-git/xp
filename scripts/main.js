/**
 * Windows XP Simulation Main Script
 * Entry point for the application that initializes all components
 */
import Desktop from './gui/desktop.js';
import Taskbar from './gui/taskbar.js';
import WindowManager from './gui/windows.js';
import StartMenu from './gui/startMenu.js';
import Clock from './gui/clock.js';
import CrtEffectManager from './utils/crtEffectManager.js';
import eventBus from './utils/eventBus.js';
import { EVENTS } from './utils/constants.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize components in dependency order
    new Clock('.time', eventBus);
    new Desktop(eventBus);
    new WindowManager(eventBus);
    new StartMenu(eventBus);
    new Taskbar(eventBus);
    new CrtEffectManager(eventBus);
    
    // Handle iframe messages
    window.addEventListener('message', (event) => {
        // Handle focus message (existing)
        if (event.data?.type === EVENTS.IFRAME_CLICKED && event.data.windowId) {
            const targetWindow = document.getElementById(event.data.windowId.split('?')[0]);
            if (targetWindow) {
                eventBus.publish(EVENTS.WINDOW_FOCUSED, { windowId: targetWindow.id });
            }
        }

        // --- Handle Project Hub message to open a new project tab --- 
        if (event.data && event.data.type === 'openProject') {
            const hubProjectId = event.data.id;
            console.log(`Received request to open project from hub: ${hubProjectId}`);

            let detailProgramName = '';

            // Map the ID from the hub to the specific detail program name in programData
            switch (hubProjectId) {
                case 'retro-os':
                    detailProgramName = 'retro-os-details'; 
                    break;
                // Add cases for other projects here when you add them
                // case 'my-other-project-id-from-hub':
                //     detailProgramName = 'my-other-project-details-program-name';
                //     break;
                default:
                    console.warn(`Hub requested unknown project ID: ${hubProjectId}`);
                    // Optionally show an error in the simulation UI
                    // alert(`Error: Cannot open unknown project '${hubProjectId}'`);
                    return; // Stop if the ID is unknown
            }

            // Publish the event to open the corresponding program/window
            // The WindowManager will handle the actual opening based on programData
            eventBus.publish(EVENTS.PROGRAM_OPEN, { programName: detailProgramName });
        }
    });
});
