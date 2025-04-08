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
import programData from './utils/programData.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Audio Unlock Setup ---
    let audioUnlocked = false;
    let unlockAudio = null;
    try {
        // Preload the sound used for unlocking (can be the same as message sound)
        unlockAudio = new Audio('./assets/sounds/msn_message.wav'); 
        unlockAudio.load();
        console.log('[Main] Preloaded unlock audio.');
    } catch (error) {
        console.error('[Main] Failed to preload unlock audio sound:', error);
    }

    const goButton = document.getElementById('goButton');
    if (goButton && unlockAudio) {
        console.log('[Main] Adding click listener to Go button.');
        goButton.addEventListener('click', () => {
            const startMessengerSequence = () => {
                // --- Auto-launch and restore Messenger ---
                const messengerProgramName = 'messenger';
                console.log('[Main] Auto-opening Messenger (minimized).');
                eventBus.publish(EVENTS.PROGRAM_OPEN, { programName: messengerProgramName });
                
                // Schedule restoration after 3000ms
                setTimeout(() => { 
                    const messengerWindowId = programData[messengerProgramName]?.id;
                    if (messengerWindowId) {
                        const messengerElement = document.getElementById(messengerWindowId);
                        if (messengerElement && messengerElement.classList.contains('minimized')) {
                            console.log('[Main] Auto-restoring Messenger.');
                            eventBus.publish(EVENTS.WINDOW_RESTORED, { windowId: messengerWindowId });
                        } else {
                            console.warn('[Main] Messenger window not found or not minimized for auto-restore.');
                        }
                    } else {
                        console.error('[Main] Could not find messenger ID for auto-restore.');
                    }
                }, 3000); // 3000ms delay for Messenger restore
                // --- End Messenger ---
            };

            const startNotepadAndIESequence = () => {
                 // --- Auto-launch and restore Notepad & IE ---
                 const notepadProgramName = 'notepad';
                 const projectsProgramName = 'projects';
                 console.log('[Main] Auto-opening Notepad and Projects (minimized).');
                 eventBus.publish(EVENTS.PROGRAM_OPEN, { programName: notepadProgramName });
                 eventBus.publish(EVENTS.PROGRAM_OPEN, { programName: projectsProgramName });

                 // Schedule restoration for Notepad at 13100ms (after fourth message + 500ms)
                 setTimeout(() => {
                     const notepadWindowId = programData[notepadProgramName]?.id;
                     if (notepadWindowId) {
                         const notepadElement = document.getElementById(notepadWindowId);
                         if (notepadElement && notepadElement.classList.contains('minimized')) {
                             console.log('[Main] Auto-restoring Notepad.');
                             eventBus.publish(EVENTS.WINDOW_RESTORED, { windowId: notepadWindowId });
                         } else {
                             console.warn('[Main] Notepad window not found or not minimized for auto-restore.');
                         }
                     } else {
                         console.error('[Main] Could not find notepad ID for auto-restore.');
                     }
                 }, 13100); // Set delay to 13100ms for Notepad (12600ms + 500ms)

                 // Schedule restoration for Projects (IE) at 9900ms (after third message + 500ms)
                 setTimeout(() => {
                     const projectsWindowId = programData[projectsProgramName]?.id;
                     if (projectsWindowId) {
                         const projectsElement = document.getElementById(projectsWindowId);
                         if (projectsElement && projectsElement.classList.contains('minimized')) {
                             console.log('[Main] Auto-restoring Projects (IE).');
                             eventBus.publish(EVENTS.WINDOW_RESTORED, { windowId: projectsWindowId });
                         } else {
                             console.warn('[Main] Projects window not found or not minimized for auto-restore.');
                         }
                     } else {
                         console.error('[Main] Could not find projects ID for auto-restore.');
                     }
                 }, 9900); // Set delay to 9900ms for Projects (IE) (9400ms + 500ms)
                 // --- End Notepad & IE ---
            };

            if (!audioUnlocked) {
                console.log('[Main] Go button clicked, attempting to unlock audio and start sequence...');
                // Attempt to play and immediately pause to unlock context
                unlockAudio.play().then(() => {
                    unlockAudio.pause();
                    audioUnlocked = true;
                    console.log('[Main] Audio context likely unlocked.');
                    goButton.style.display = 'none'; // Hide button after successful unlock
                    startMessengerSequence(); // Start the sequence AFTER unlocking audio
                    startNotepadAndIESequence(); // Start this sequence too
                }).catch(error => {
                    console.error('[Main] Error trying to unlock audio via play/pause:', error);
                    goButton.style.display = 'none'; // Hide button even on error
                    startMessengerSequence(); // Start the sequence even if audio unlock failed
                    startNotepadAndIESequence(); // Start this sequence too
                });
            } else {
                 // If already unlocked (e.g., unlikely edge case), just hide and start
                 goButton.style.display = 'none';
                 startMessengerSequence();
                 startNotepadAndIESequence();
            }
        }, { once: true }); 
    } else {
        if (!goButton) console.error("[Main] Go button not found!");
        if (!unlockAudio) console.error("[Main] Unlock audio object not available!");
    }
    // --- End Audio Unlock Setup ---

    // Initialize components in dependency order
    new Clock('.time', eventBus);
    new Desktop(eventBus);
    const windowManager = new WindowManager(eventBus);
    new StartMenu(eventBus);
    new Taskbar(eventBus);
    new CrtEffectManager(eventBus);
    
    // Handle iframe messages
    window.addEventListener('message', (event) => {
        // Handle focus message (Simplification: Trigger focus on ANY iframe click)
        if (event.data?.type === EVENTS.IFRAME_CLICKED) { 
            // We don't strictly need the windowId *for the StartMenu closing logic*,
            // just knowing *a* relevant click happened is enough.
            // Publish a generic focus event without specific ID for StartMenu.
            // NOTE: This assumes WindowManager doesn't *need* the specific ID from this *exact* message.
            // If WindowManager *does* need it, we'd have to ensure apps send the ID.
            eventBus.publish(EVENTS.WINDOW_FOCUSED, { windowId: null }); // Send null ID
            // Stop propagation here IF this message isn't needed by WindowManager directly
            // event.stopPropagation(); 
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
