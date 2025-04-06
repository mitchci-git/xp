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
            if (event.data?.type === EVENTS.IFRAME_CLICKED) {
                const windowId = event.data.windowId;
                if (windowId) {
                    const baseWindowId = windowId.split('?')[0];
                    const targetWindow = document.getElementById(baseWindowId);
                    
                    if (targetWindow) {
                        this.bringToFront(targetWindow);
                        event.stopPropagation();
                    }
                }
            }
        }, true);
    }
    
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
        
        this.bringToFront(window); // Bring the newly created window to front
    }
    
    createWindowFromTemplate(program) {
        const window = document.createElement('div');
        window.id = program.id;
        window.className = 'window';
        window.setAttribute('data-program', program.id.replace('-window', ''));
        
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
        
        const statusBar = document.createElement('div');
        statusBar.className = 'status-bar';
        statusBar.innerHTML = '<p class="status-bar-field">Ready</p>';
        window.appendChild(statusBar);
        
        // Use dimensions from program data, with fallbacks
        const defaultWidth = 600;
        const defaultHeight = 400;
        window.style.width = `${program.dimensions?.width || defaultWidth}px`; 
        window.style.height = `${program.dimensions?.height || defaultHeight}px`;
        
        // Initial position centered - cascade/constrain happens later
        window.style.position = 'absolute';
        window.style.left = '50%';
        window.style.top = '50%';
        window.style.transform = 'translate(-50%, -50%)';
        
        return window;
    }
    
    positionWindowCascade(window) {
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
        this.bringToFront(window);
        this.constrainWindowToViewport(window);
        this.setupResponsiveHandling(window);
        // console.log(`[registerWindow] END for ${window.id}`); // Removed log
    }
    
    setupWindowEvents(window, controls) {
        const { minimizeBtn, maximizeBtn, closeBtn, titleBar } = controls;
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeWindow(window));
        }
        
        const okButton = window.querySelector('#ok-button');
        if (okButton) {
            okButton.addEventListener('click', () => this.closeWindow(window));
        }
        
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => this.minimizeWindow(window));
        }
        
        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', () => this.toggleMaximize(window));
        }
        
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
        
        this.eventBus.publish(EVENTS.WINDOW_RESTORED, { windowId: window.id });
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
            if (win !== excludeWindow) {
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
            
            if (window !== this.activeWindow) {
                this.bringToFront(window);
            }
            
            isDragging = true;
            prepareWindowForDrag();
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                e.preventDefault(); 
                
                window.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
            }
        }, { passive: false });
        
        handleElement.addEventListener('touchstart', (e) => {
            if (e.target.tagName === 'BUTTON' || (window.windowState && window.windowState.isMaximized)) return;
            
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            
            if (window !== this.activeWindow) {
                this.bringToFront(window);
            }
            
            isDragging = true;
            prepareWindowForDrag();
            
            e.preventDefault();
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