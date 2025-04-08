/**
 * Window manager module for handling window operations
 */
import WindowTemplates from './windowTemplates.js';
import programData from '../utils/programData.js';
import { EVENTS } from '../utils/constants.js';

export default class WindowManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.windows = {};
        this.activeWindow = null;
        this.taskbarItems = {};
        this.windowCount = 0;
        this.cascadeOffset = 35;
        this.programData = programData;
        
        this.init();
        this.subscribeToEvents();
        this.setupGlobalHandlers();
    }
    
    setupGlobalHandlers() {
        // Global click handler to deactivate windows when clicking desktop
        document.addEventListener('mousedown', (e) => {
            // Check if the direct click target is the desktop or overlay
            const clickedOnDesktopSpace = 
                e.target.classList.contains('desktop') ||
                e.target.classList.contains('selection-overlay');

            if (clickedOnDesktopSpace) {
                // Make sure the click wasn't actually inside a window
                // (e.g., on padding/margin of the overlay/desktop element
                // that happens to be visually behind a window)
                if (!e.target.closest('.window')) { 
                    if (this.activeWindow) {
                        this.deactivateAllWindows();
                    }
                    // Allow desktop component to handle its own click/drag logic
                    // e.stopPropagation(); // Removed stopPropagation
                }
            }
        }, true); // Use capture phase to potentially intercept before others

        // Handle iframe messages for window activation
        window.addEventListener('message', (event) => {
            // REMOVE direct handling - this is now handled via main.js -> eventBus
            // if (event.data?.type === EVENTS.IFRAME_CLICKED) { 
            //     const windowId = event.data.windowId;
            //     if (windowId) {
            //         const baseWindowId = windowId.split('?')[0];
            //         const targetWindow = document.getElementById(baseWindowId);
            //         
            //         if (targetWindow) {
            //             this.bringToFront(targetWindow);
            //             event.stopPropagation();
            //         }
            //     }
            // } else 
            // --- Handle Project Hub message (KEEP THIS) --- 
            if (event.data?.type === 'openProject') { // Note: Removed the 'else' here
                const hubProjectId = event.data.id;
                // ... rest of project hub logic ... 
            } 
            // --- Handle other message types (KEEP THESE) ---
            else if (event.data?.type === 'minimize-window') {
                // Find the parent window using the helper
                const window = this._getWindowFromIframeSource(event.source);
                
                if (window) {
                    this.minimizeWindow(window);
                }
            } else if (event.data?.type === 'close-window') {
                // Find the parent window of the iframe that sent this message
                const window = this._getWindowFromIframeSource(event.source);
                
                if (window) {
                    this.closeWindow(window);
                }
            }
        }, true);
    }
    
    // --- Private Helper Method ---
    _getWindowFromIframeSource(eventSource) {
        const iframe = Array.from(document.querySelectorAll('iframe')).find(
            iframe => iframe.contentWindow === eventSource
        );
        return iframe ? iframe.closest('.window') : null;
    }
    // --- End Helper Method ---

    subscribeToEvents() {
        this.eventBus.subscribe(EVENTS.PROGRAM_OPEN, data => {
            this.openProgram(data.programName);
        });
        
        this.eventBus.subscribe(EVENTS.WINDOW_MINIMIZE, data => {
            const window = document.getElementById(data.windowId);
            if (window) this.minimizeWindow(window);
        });
        
        this.eventBus.subscribe(EVENTS.WINDOW_MAXIMIZE, data => {
            const window = document.getElementById(data.windowId);
            if (window) this.toggleMaximize(window);
        });
        
        this.eventBus.subscribe(EVENTS.WINDOW_CLOSE, data => {
            const window = document.getElementById(data.windowId);
            if (window) this.closeWindow(window);
        });
        
        this.eventBus.subscribe(EVENTS.WINDOW_FOCUSED, data => {
            const window = document.getElementById(data.windowId);
            if (window) this.bringToFront(window);
        });
        
        this.eventBus.subscribe(EVENTS.WINDOW_RESTORED, data => {
            const window = document.getElementById(data.windowId);
            if (window) this.restoreWindow(window);
        });
        
        this.eventBus.subscribe(EVENTS.TASKBAR_ITEM_CLICKED, data => {
            const window = document.getElementById(data.windowId);
            const programName = data.windowId.replace('-window', '');
            
            if (window) {
                // Window exists: Handle restore/minimize/focus
                if (window.classList.contains('minimized')) {
                    this.restoreWindow(window);
                } else if (this.activeWindow === window) {
                    this.minimizeWindow(window);
                } else {
                    this.bringToFront(window);
                }
            } else {
                // Window doesn't exist, attempt to open it.
                // openProgram will handle the isOpen flag logic correctly.
                if (programName && this.programData[programName]) { 
                    this.openProgram(programName);
                }
            }
        });
    }
    
    init() {
        document.querySelectorAll('.window').forEach(window => {
            this.registerWindow(window);
        });
    }
    
    openProgram(programName) {
        const program = this.programData[programName];
        if (!program || !program.id) {
            console.error(`Invalid program data for: ${programName}`);
            return;
        }
        
        // console.log(`[openProgram] START - Opening: ${programName}.`); // Removed log

        // --- Primary Check: Does the window element already exist? ---
        const existingWindow = document.getElementById(program.id);
        
        if (existingWindow) {
            // console.log(`[openProgram] Found existing window element #${program.id}. Focusing.`); // Removed log
            if (existingWindow.classList.contains('minimized')) {
                this.restoreWindow(existingWindow);
            }
            this.bringToFront(existingWindow);
            return; // Don't open a new window
        }

        // --- Element doesn't exist, proceed to create --- 
        // console.log(`[openProgram] No existing window element found for ${programName}. Creating NEW window.`); // Removed log
        
        // Reset isOpen flag just in case it was stuck (good practice)
        if (program.isOpen) {
                 // console.warn(`[openProgram] Resetting stale isOpen flag for ${programName} because window element was missing.`); // Keep warn?
                 this.programData[programName].isOpen = false;
            }

        const window = this.createWindowFromTemplate(program);
        if (!window) return;
        
        document.getElementById('windows-container').appendChild(window);
        this.positionWindowCascade(window);
        this.registerWindow(window); // Register will set up events, state, etc.
        
        // console.log(`[openProgram] Setting this.programData[${programName}].isOpen = true`); // Removed log
        this.programData[programName].isOpen = true; // Set flag after successful creation
        // console.log(`[openProgram] Value of this.programData[${programName}].isOpen AFTER set:`, this.programData[programName]?.isOpen); // Removed log
        
        this.eventBus.publish(EVENTS.WINDOW_CREATED, {
            windowId: window.id,
            programName,
            title: program.title,
            icon: program.icon
        });

        // Check for startMinimized flag AFTER registering and creating taskbar item
        if (program.startMinimized) {
            console.log(`[WindowManager] Start minimized requested for ${programName}. Minimizing.`);
            this.minimizeWindow(window); // Minimize if flagged
        } else {
            // Only bring to front if NOT starting minimized
            this.bringToFront(window); // Bring normal windows to front
        }
    }
    
    createWindowFromTemplate(program) {
        const window = document.createElement('div');
        window.id = program.id;
        window.className = 'window';
        window.setAttribute('data-program', program.id.replace('-window', ''));
        
        // Standard window with title bar
        window.innerHTML = `
            <div class="title-bar">
                <div class="title-bar-left">
                    <div class="title-bar-icon">
                        <img src="${program.icon}" alt="${program.title}">
                    </div>
                    <div class="title-bar-text">${program.title}</div>
                </div>
                <div class="title-bar-controls">
                    <button aria-label="Minimize"></button>
                    <button aria-label="Maximize"></button>
                    <button aria-label="Close"></button>
                </div>
            </div>
            <div class="window-inactive-mask"></div>
        `;
        
        const content = WindowTemplates.getTemplate(program.template, program);
        window.appendChild(content);
        
        // Add the Start Menu interaction overlay INSIDE the content area
        const startMenuOverlay = document.createElement('div');
        startMenuOverlay.className = 'start-menu-content-click-overlay';
        // Ensure it's appended to the content body, not the main window div
        // If content is the iframe container, append it there.
        if (content.classList.contains('window-body')) { 
             content.style.position = 'relative'; // Ensure parent is positioned
             content.appendChild(startMenuOverlay);
        } else {
             // Fallback: append to window itself, might not cover correctly
             console.warn('Could not find .window-body to append start menu overlay');
             window.appendChild(startMenuOverlay);
        }
        
        // Don't add status bar for the messenger window
        if (program.id !== 'messenger-window') {
            const statusBar = document.createElement('div');
            statusBar.className = 'status-bar';
            statusBar.innerHTML = '<p class="status-bar-field">Ready</p>';
            window.appendChild(statusBar);
        }
        
        const defaultWidth = 600;
        const defaultHeight = 400;
        window.style.width = `${program.dimensions?.width || defaultWidth}px`; 
        window.style.height = `${program.dimensions?.height || defaultHeight}px`;
        
        // Set initial position but don't center if custom positioning will be used
        window.style.position = 'absolute';
        
        // Only apply centered position if not using custom positioning
        if (!program.position || program.position.type !== "custom") {
            window.style.left = '50%';
            window.style.top = '50%';
            window.style.transform = 'translate(-50%, -50%)';
        }
        
        return window;
    }
    
    positionWindowCascade(window) {
        const programName = window.getAttribute('data-program');
        const program = this.programData[programName];
        const desktop = document.querySelector('.desktop');
        const taskbarHeight = document.querySelector('.taskbar')?.offsetHeight || 30;
        const desktopBounds = desktop.getBoundingClientRect();
        const availableWidth = desktopBounds.width;
        const availableHeight = desktopBounds.height - taskbarHeight;

        let width = program?.dimensions?.width || 600;
        let height = program?.dimensions?.height || 400;

        // Adjust height for messenger specifically to account for removed status bar
        if (programName === 'messenger') {
            const statusBarHeight = 22; // From styles/gui/windows.css
            height -= statusBarHeight;
        }

        // Ensure window fits within bounds
        width = Math.min(width, availableWidth);
        
        // Check if custom positioning is defined for this program
        if (program && program.position && program.position.type === "custom") {
            this.positionWindowCustom(window, program.position);
            return;
        }
        
        // Default cascade positioning behavior
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        
        const offsetX = 120 + (this.windowCount * this.cascadeOffset);
        const offsetY = 100 + (this.windowCount * this.cascadeOffset);
        
        const maxOffsetX = Math.min(viewportWidth * 0.6, viewportWidth - 300); 
        const maxOffsetY = Math.min(viewportHeight * 0.6, viewportHeight - 200);
        
        const finalX = offsetX > maxOffsetX ? 120 : offsetX;
        const finalY = offsetY > maxOffsetY ? 100 : offsetY;
        
        window.style.position = 'absolute';
        window.style.left = finalX + 'px';
        window.style.top = finalY + 'px';
        window.style.transform = 'none';
        
        this.windowCount++;
        
        if (offsetX > maxOffsetX || offsetY > maxOffsetY) {
            this.windowCount = 1;
        }
        
        this.constrainWindowToViewport(window);
    }
    
    // New method to handle custom window positioning
    positionWindowCustom(window, posConfig) {
        const programName = window.getAttribute('data-program');
        const program = this.programData[programName];
        
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        
        // Get dimensions from program data if available, otherwise use style or defaults
        const windowWidth = program?.dimensions?.width || 
                           parseInt(window.style.width) || 600;
        const windowHeight = program?.dimensions?.height || 
                            parseInt(window.style.height) || 400;
        
        // Calculate taskbar height (to avoid positioning windows under taskbar)
        const taskbarHeight = document.querySelector('.taskbar')?.offsetHeight || 40;
        const adjustedViewportHeight = viewportHeight - taskbarHeight;
        
        // Define safe margins - ensure windows are never off-screen
        const safeMarginX = 20; // Minimum distance from screen edge
        const safeMarginY = 20; // Minimum distance from screen edge
        
        // Calculate maximum possible positions that keep the window on screen
        const maxLeftPos = viewportWidth - windowWidth - safeMarginX;
        const maxTopPos = adjustedViewportHeight - windowHeight - safeMarginY;
        
        let leftPos = 0;
        let topPos = 0;
        
        // Position based on alignment
        switch (posConfig.align) {
            case "bottom-right":
                leftPos = viewportWidth - windowWidth - (posConfig.offsetX || 0);
                topPos = adjustedViewportHeight - windowHeight - (posConfig.offsetY || 0);
                break;
            case "center-right":
                leftPos = viewportWidth - windowWidth - (posConfig.offsetX || 0);
                topPos = Math.max(0, (adjustedViewportHeight - windowHeight) / 2);
                break;
            case "left-of-browser":
                // Calculate shifted browser position (projects window)
                const browserWidth = 1000; // From programData
                const browserHeight = 850; // From programData
                const browserShiftOffset = 175; // Calculated offset to center the group
                const browserLeft = (viewportWidth / 2) - browserShiftOffset;
                const browserTop = Math.max(0, (adjustedViewportHeight - browserHeight) / 2);
                const browserBottom = browserTop + browserHeight;

                // Position notepad to the left of browser with bottom edges aligned
                leftPos = browserLeft - windowWidth - (posConfig.offsetX || 0); // offsetX still used for spacing
                topPos = browserBottom - windowHeight;
                break;
            case "left-of-browser-top":
                // Calculate shifted browser position (projects window)
                const browserWidthTop = 1000; // From programData
                const browserHeightTop = 850; // From programData
                const browserShiftOffsetTop = 175; // Calculated offset to center the group
                const browserLeftTop = (viewportWidth / 2) - browserShiftOffsetTop;
                const browserTopTop = Math.max(0, (adjustedViewportHeight - browserHeightTop) / 2);

                // Position CMD to the left of browser with top edges aligned
                leftPos = browserLeftTop - windowWidth - (posConfig.offsetX || 0); // offsetX still used for spacing
                topPos = browserTopTop + (posConfig.offsetY || 0); // Use offsetY if needed for vertical tweak
                break;
            case "bottom-left":
                leftPos = posConfig.offsetX || 0;
                topPos = adjustedViewportHeight - windowHeight - (posConfig.offsetY || 0);
                break;
            case "top-right":
                leftPos = viewportWidth - windowWidth - (posConfig.offsetX || 0);
                topPos = posConfig.offsetY || 0;
                break;
            case "top-left":
                leftPos = posConfig.offsetX || 0;
                topPos = posConfig.offsetY || 0;
                break;
            case "center":
                // Adjusted center: Shift left by calculated offset to center the visual group
                const centerShiftOffset = 175; // Calculated offset to center the group
                leftPos = (viewportWidth / 2) - centerShiftOffset;
                topPos = (adjustedViewportHeight - windowHeight) / 2;
                break;
            default:
                // Default to cascade if alignment is unknown
                return this.positionWindowCascade(window);
        }
        
        // Enforce safe boundaries - ensure window is never off-screen
        leftPos = Math.max(safeMarginX, Math.min(leftPos, maxLeftPos));
        topPos = Math.max(safeMarginY, Math.min(topPos, maxTopPos));
        
        // Apply position
        window.style.position = 'absolute';
        window.style.left = `${leftPos}px`;
        window.style.top = `${topPos}px`;
        window.style.transform = 'none';
        
        // No need to call constrainWindowToViewport since we've already handled boundaries
    }
    
    registerWindow(window) {
        // console.log(`[registerWindow] START for ${window.id}`); // Removed log
        const windowId = window.id;
        const programName = window.getAttribute('data-program');
        const program = this.programData[programName];

        // Create taskbar item first
        if (program) {
            this.createTaskbarItem(window, program);
        }

        const controls = {
            minimizeBtn: window.querySelector('[aria-label="Minimize"]'),
            maximizeBtn: window.querySelector('[aria-label="Maximize"]'),
            closeBtn: window.querySelector('[aria-label="Close"]'),
            titleBar: window.querySelector('.title-bar')
        };
        
        this.windows[windowId] = window;
        
        window.windowState = {
            isMaximized: false,
            isMinimized: false,
            originalStyles: {
                width: window.style.width || '600px',
                height: window.style.height || '400px',
                top: window.style.top || '50%',
                left: window.style.left || '50%',
                transform: window.style.transform || 'translate(-50%, -50%)'
            }
        };
        
        this.setupWindowEvents(window, controls);

        // Add the Start Menu overlay click listener ONCE here
        const startMenuOverlay = window.querySelector('.start-menu-content-click-overlay');
        if (startMenuOverlay && this.eventBus) { // Check eventBus exists
            startMenuOverlay.addEventListener('mousedown', (e) => {
                // This listener is always active, but overlay is usually hidden.
                // If clicked (meaning it's visible), tell StartMenu to close.
                console.log('[Overlay Mousedown] Detected on overlay for window:', window.id);
                e.stopPropagation(); // Stop click from going further
                e.preventDefault();
                this.eventBus.publish(EVENTS.STARTMENU_CLOSE_REQUEST); // New event
            });
        } else if (!startMenuOverlay) {
             console.error('Could not find .start-menu-content-click-overlay during registration for:', window.id);
        } else if (!this.eventBus) {
             console.error('WindowManager cannot add overlay listener: eventBus not available.');
        }

        this.bringToFront(window);
        this.constrainWindowToViewport(window);
        this.setupResponsiveHandling(window);
        // console.log(`[registerWindow] END for ${window.id}`); // Removed log
    }
    
    setupWindowEvents(window, controls) {
        const { minimizeBtn, maximizeBtn, closeBtn, titleBar } = controls;
        const programName = window.getAttribute('data-program');
        const program = this.programData[programName];
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeWindow(window));
        }
        
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => this.minimizeWindow(window));
        }
        
        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', () => this.toggleMaximize(window));
        }
        
        // For standard windows, make the title bar draggable
        if (titleBar) {
            this.makeDraggable(window, titleBar);
            titleBar.addEventListener('dblclick', () => this.toggleMaximize(window));
        }
        
        window.addEventListener('mousedown', () => {
            if (window !== this.activeWindow) {
                this.bringToFront(window);
            }
        }, true);
        
        this.setupIframeOverlayForActivation(window);
    }

    setupIframeOverlayForActivation(window) {
        const iframes = window.querySelectorAll('iframe');
        
        iframes.forEach(iframe => {
            const overlay = document.createElement('div');
            overlay.className = 'iframe-overlay';
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.zIndex = '10';
            overlay.style.display = 'none';
            
            const iframeParent = iframe.parentElement;
            iframeParent.style.position = 'relative';
            iframeParent.appendChild(overlay);
            
            overlay.addEventListener('mousedown', (e) => {
                if (window !== this.activeWindow) {
                    this.bringToFront(window);
                }
                e.preventDefault();
                e.stopPropagation();
            });
            
            if (!window.iframeOverlays) window.iframeOverlays = [];
            window.iframeOverlays.push(overlay);
        });
    }
    
    createTaskbarItem(window, program) {
        const taskbarPrograms = document.querySelector('.taskbar-programs');
        const taskbarItem = document.createElement('div');
        taskbarItem.className = 'taskbar-item';
        taskbarItem.id = `taskbar-${window.id}`;
        
        taskbarItem.innerHTML = `
            <img src="${program.icon}" alt="${program.title}" />
            <span>${program.title}</span>
        `;
        
        taskbarItem.addEventListener('mousedown', () => {
            this.eventBus.publish(EVENTS.TASKBAR_ITEM_CLICKED, { windowId: window.id });
        });
        
        taskbarPrograms.appendChild(taskbarItem);
        this.taskbarItems[window.id] = taskbarItem;
        return taskbarItem;
    }
    
    closeWindow(window) {
        if (window.responsiveObserver) {
            window.responsiveObserver.disconnect();
            window.responsiveObserver = null;
        }
        
        if (window.iframeResizeObserver) {
            window.iframeResizeObserver.disconnect();
            window.iframeResizeObserver = null;
        }
        
        if (window.parentNode) {
            window.parentNode.removeChild(window);
        }

        const programName = Object.keys(this.programData).find(
            name => this.programData[name].id === window.id
        );
        
        if (programName) {
            // console.log(`[closeWindow] Setting this.programData[${programName}].isOpen = false`); // Removed log
            this.programData[programName].isOpen = false;
            // console.log(`[closeWindow] Value of this.programData[${programName}].isOpen AFTER set:`, this.programData[programName]?.isOpen); // Removed log
        }
        
        if (this.taskbarItems[window.id]) {
            this.taskbarItems[window.id].remove();
            delete this.taskbarItems[window.id];
        }
        
        delete this.windows[window.id];
        
        if (this.activeWindow === window) {
            this.activeWindow = null;
            
            const topWindow = Object.values(this.windows).filter(
                w => !w.classList.contains('minimized')
            ).pop();
            
            if (topWindow) {
                this.bringToFront(topWindow);
            }
        }
        
        this.eventBus.publish(EVENTS.WINDOW_CLOSED, { windowId: window.id });
        this.windowCount = Math.max(0, this.windowCount - 1);
    }
    
    minimizeWindow(window) {
        window.classList.add('minimized');
        window.windowState.isMinimized = true;
        window.style.display = 'none';
        
        const taskbarItem = this.taskbarItems[window.id];
        if (taskbarItem) {
            taskbarItem.classList.remove('active');
        }
        
        if (this.activeWindow === window) {
            this.activeWindow = null;
            
            const topWindow = Object.values(this.windows).filter(
                w => !w.classList.contains('minimized')
            ).pop();
            
            if (topWindow) {
                this.bringToFront(topWindow);
            }
        }
        
        this.eventBus.publish(EVENTS.WINDOW_MINIMIZED, { windowId: window.id });
    }
    
    restoreWindow(window) {
        window.classList.remove('minimized');
        window.windowState.isMinimized = false;
        window.style.display = 'flex';
        this.bringToFront(window);
    }
    
    toggleMaximize(window) {
        const state = window.windowState;
        
        if (!state.isMaximized) {
            const rect = window.getBoundingClientRect();
            state.originalStyles = {
                width: window.style.width || rect.width + 'px',
                height: window.style.height || rect.height + 'px',
                top: window.style.top || rect.top + 'px',
                left: window.style.left || rect.left + 'px',
                transform: window.style.transform || ''
            };
            
            const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
            const taskbarHeight = 30;
            
            window.style.position = 'absolute';
            window.style.top = '0';
            window.style.left = '0';
            window.style.width = vw + 'px';
            window.style.height = (vh - taskbarHeight) + 'px';
            window.style.margin = '0';
            window.style.padding = '0';
            window.style.border = '0';
            window.style.borderRadius = '0';
            window.style.transform = 'none';
            window.style.boxSizing = 'border-box';
            window.style.maxWidth = 'none';
            window.style.maxHeight = 'none';
            window.style.minWidth = '0';
            window.style.minHeight = '0';
            
            state.isMaximized = true;
            window.classList.add('maximized');
            
            const maximizeBtn = window.querySelector('[aria-label="Maximize"]');
            if (maximizeBtn) {
                maximizeBtn.classList.add('restore');
            }
            
            this.eventBus.publish(EVENTS.WINDOW_MAXIMIZED, { windowId: window.id });
        } else {
            window.style.width = state.originalStyles.width;
            window.style.height = state.originalStyles.height;
            window.style.top = state.originalStyles.top;
            window.style.left = state.originalStyles.left;
            window.style.transform = state.originalStyles.transform;
            
            window.style.margin = '';
            window.style.padding = '';
            window.style.border = '';
            window.style.borderRadius = '';
            window.style.maxWidth = '';
            window.style.maxHeight = '';
            window.style.minWidth = '';
            window.style.minHeight = '';
            window.style.boxSizing = '';
            
            state.isMaximized = false;
            window.classList.remove('maximized');
            
            const maximizeBtn = window.querySelector('[aria-label="Maximize"]');
            if (maximizeBtn) {
                maximizeBtn.classList.remove('restore');
            }
            
            this.eventBus.publish(EVENTS.WINDOW_UNMAXIMIZED, { windowId: window.id });
        }
    }
    
    bringToFront(window) {
        if (!window) return;
        
        if (window.classList.contains('minimized')) {
            this.restoreWindow(window);
            return;
        }
        
        this.deactivateAllWindows(window);
        
        window.classList.add('active');
        this.activeWindow = window;
        
        const inactiveMask = window.querySelector('.window-inactive-mask');
        if (inactiveMask) {
            inactiveMask.style.display = 'none';
        }
        
        // Get base z-index from CSS variable
        const baseZIndex = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--z-window')) || 100;
        
        // Set z-index relative to base
        window.style.zIndex = baseZIndex + 1;
        
        // If this is the Messenger window, ensure it stays active
        if (window.getAttribute('data-program') === 'messenger') {
            window.classList.add('active');
            if (inactiveMask) {
                inactiveMask.style.display = 'none';
            }
        }
        
        const taskbarItem = this.taskbarItems[window.id];
        if (taskbarItem) {
            taskbarItem.classList.add('active');
            
            // Update all other taskbar items to be inactive
            Object.entries(this.taskbarItems).forEach(([id, item]) => {
                if (id !== window.id) {
                    item.classList.remove('active');
                }
            });
        }
        
        // Hide iframe overlays for the active window
        if (window.iframeOverlays) {
            window.iframeOverlays.forEach(overlay => overlay.style.display = 'none');
        }
    }
    
    deactivateAllWindows(excludeWindow = null) {
        // Get base z-index from CSS variable
        const baseZIndex = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--z-window')) || 100;
        
        Object.values(this.windows).forEach(win => {
            // Skip the excludeWindow and the Messenger window
            if (win !== excludeWindow && win.getAttribute('data-program') !== 'messenger') {
                // Set inactive windows to base z-index
                win.style.zIndex = baseZIndex;
                win.classList.remove('active');
                
                const inactiveMask = win.querySelector('.window-inactive-mask');
                if (inactiveMask) {
                    inactiveMask.style.display = 'block';
                }
                
                // Show iframe overlays for inactive windows
                if (win.iframeOverlays) {
                    win.iframeOverlays.forEach(overlay => overlay.style.display = 'block');
                }
                
                const taskbarItem = this.taskbarItems[win.id];
                if (taskbarItem) {
                    taskbarItem.classList.remove('active');
                }
            }
        });
        
        if (!excludeWindow) {
            this.activeWindow = null;
        }
    }
    
    makeDraggable(window, handleElement) {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        let dragOffsetX = 0, dragOffsetY = 0;

        const endDrag = (e) => {
            if (!isDragging) return;

            const finalClientX = e.clientX ?? (e.changedTouches?.[0]?.clientX ?? startX);
            const finalClientY = e.clientY ?? (e.changedTouches?.[0]?.clientY ?? startY);

            const deltaX = finalClientX - startX;
            const deltaY = finalClientY - startY;
            
            const viewportWidth = document.documentElement.clientWidth;
            const viewportHeight = document.documentElement.clientHeight;
            const taskbarHeight = 30; 
            const windowWidth = window.offsetWidth;
            const windowHeight = window.offsetHeight;

            const finalLeft = initialX + deltaX;
            const finalTop = initialY + deltaY;
            
            const constrainedLeft = Math.max(
                -windowWidth + 100,
                Math.min(finalLeft, viewportWidth - 100)
            );
            const constrainedTop = Math.max(
                0,
                Math.min(finalTop, viewportHeight - taskbarHeight - 20)
            );
            
            window.style.left = `${constrainedLeft}px`;
            window.style.top = `${constrainedTop}px`;
            
            if (window.windowState) {
                window.windowState.originalStyles.left = window.style.left;
                window.windowState.originalStyles.top = window.style.top;
                window.windowState.originalStyles.transform = 'none';
            }
            
            cleanupAfterDrag();
            
            isDragging = false;
        };

        function prepareWindowForDrag() {
            window.classList.add('dragging-window');
            
            const rect = window.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            
            const parentRect = window.offsetParent?.getBoundingClientRect() || { left: 0, top: 0 };
            const currentStyle = window.currentStyle || window.getComputedStyle(window);
            const currentLeft = parseFloat(currentStyle.left) || 0;
            const currentTop = parseFloat(currentStyle.top) || 0;

            dragOffsetX = rect.left - parentRect.left - currentLeft;
            dragOffsetY = rect.top - parentRect.top - currentTop;            
            
            window.style.transform = `translate3d(0px, 0px, 0px)`; 
        }
        
        function cleanupAfterDrag() {
            window.classList.remove('dragging-window');
            window.style.transform = 'none';
        }
        
        handleElement.addEventListener('mousedown', (e) => {
            if (e.button !== 0 || e.target.tagName === 'BUTTON' || (window.windowState && window.windowState.isMaximized)) return;
            
            startX = e.clientX;
            startY = e.clientY;
            
            isDragging = true;
            prepareWindowForDrag();

            e.preventDefault();
        });
        
        handleElement.addEventListener('touchstart', (e) => {
            if (e.target.tagName === 'BUTTON' || (window.windowState && window.windowState.isMaximized)) return;
            
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            
            isDragging = true;
            prepareWindowForDrag();

            e.preventDefault();
        }, { passive: false });

        // Original global listeners within makeDraggable scope
        document.addEventListener('mousemove', (e) => {
             if (isDragging) {
                 const deltaX = e.clientX - startX;
                 const deltaY = e.clientY - startY;
                 e.preventDefault(); 
                 
                 window.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
             }
         }, { passive: false });

        document.addEventListener('touchmove', (e) => {
             if (isDragging) {
                 const touch = e.touches[0];
                 const deltaX = touch.clientX - startX;
                 const deltaY = touch.clientY - startY;
                 e.preventDefault();
                 
                 window.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
             }
         }, { passive: false });

        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
        document.addEventListener('touchcancel', endDrag);
    }
    
    constrainWindowToViewport(window) {
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        const taskbarHeight = 30;
        
        const windowWidth = parseInt(window.style.width) || 600;
        const windowHeight = parseInt(window.style.height) || 400;
        
        let windowLeft = parseInt(window.style.left) || 0;
        let windowTop = parseInt(window.style.top) || 0;
        
        if (window.style.transform && window.style.transform.includes('translate')) {
            if (window.style.left === '50%') {
                windowLeft = (viewportWidth - windowWidth) / 2;
            }
            if (window.style.top === '50%') {
                windowTop = (viewportHeight - windowHeight) / 2;
            }
            window.style.transform = 'none';
        }
        
        const maxWidth = viewportWidth - 20;
        const maxHeight = viewportHeight - taskbarHeight - 10;
        
        let scale = 1;
        if (windowWidth > maxWidth || windowHeight > maxHeight) {
            const scaleX = maxWidth / windowWidth;
            const scaleY = maxHeight / windowHeight;
            scale = Math.min(scaleX, scaleY, 1);
        }
        
        let newWidth = windowWidth;
        let newHeight = windowHeight;
        if (scale < 1) {
            newWidth = Math.floor(windowWidth * scale);
            newHeight = Math.floor(windowHeight * scale);
        }
        
        if (windowLeft + newWidth > viewportWidth) {
            windowLeft = Math.max(0, (viewportWidth - newWidth) / 2);
        }
        if (windowTop + newHeight > viewportHeight - taskbarHeight) {
            windowTop = Math.max(0, (viewportHeight - newHeight - taskbarHeight) / 2);
        }
        
        if (scale < 1) {
            window.style.width = newWidth + 'px';
            window.style.height = newHeight + 'px';
        }
        window.style.left = `${windowLeft}px`;
        window.style.top = `${windowTop}px`;
        
        if (window.windowState) {
            if (scale < 1) {
                window.windowState.originalStyles.width = window.style.width;
                window.windowState.originalStyles.height = window.style.height;
            }
            window.windowState.originalStyles.left = window.style.left;
            window.windowState.originalStyles.top = window.style.top;
            window.windowState.originalStyles.transform = 'none';
        }
    }
    
    setupResponsiveHandling(window) {
        const resizeObserver = new ResizeObserver(() => {
            if (window && !window.windowState.isMaximized && !window.windowState.isMinimized) {
                this.constrainWindowToViewport(window);
            }
        });
        
        resizeObserver.observe(document.body);
        window.responsiveObserver = resizeObserver;
    }
}