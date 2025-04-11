/**
 * Taskbar module for managing the start menu and system tray
 */
import StartMenu from './startMenuManager.js';
import { eventBus, EVENTS } from '../utils/eventBus.js';
import Desktop from './desktopManager.js'; // Update the import path to use the new filename
import programData from '../utils/programRegistry.js';
import { setupTooltips } from '../utils/tooltip.js'; // Import the new utility

/**
 * Clock class for managing the system clock display and time updates
 */
class Clock {
    #clockElement;
    #intervalId = null;
    #initialTimeoutId = null;
    #timeFormatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true
    });
    
    constructor(selector) {
        this.#clockElement = document.querySelector(selector);
        
        if (!this.#clockElement) {
            console.error(`Clock element not found with selector: ${selector}`);
            return;
        }
        
        this.setupClockUpdates();
    }
    
    setupClockUpdates() {
        // Clear existing timers
        clearTimeout(this.#initialTimeoutId);
        clearInterval(this.#intervalId);
            
        const now = new Date();
        // Calculate milliseconds until the start of the next minute
        const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
            
        // First update happens immediately
        this.updateClock();

        // Set a timeout to fire exactly at the start of the next minute
        this.#initialTimeoutId = setTimeout(() => {
            this.updateClock();
            // Then update every minute
            this.#intervalId = setInterval(() => this.updateClock(), 60000);
        }, msUntilNextMinute);
    }
    
    updateClock() {
        if (!this.#clockElement) return;
        this.#clockElement.textContent = this.#timeFormatter.format(new Date());
    }
    
    destroy() {
        [this.#initialTimeoutId, this.#intervalId].forEach(id => id && clearTimeout(id));
        this.#initialTimeoutId = this.#intervalId = null;
    }
}

export default class Taskbar {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.startButton = document.getElementById('start-button');
        this.startMenuComponent = new StartMenu(this.eventBus);
        this.programsContainer = document.querySelector('.taskbar-programs');
        this.systemTray = document.querySelector('.system-tray');
        
        this.setupStartButtonEffects();
        this.setupTrayIconEvents();
        this.setupResponsiveTaskbar();

        // Call the new utility function for system tray icons
        setupTooltips('.tray-status-icon, .tray-network-icon, .tray-volume-icon'); 

        // Initialize the clock
        new Clock('.time');

        this.subscribeToEvents();
    }
    
    /**
     * Subscribe to event bus events
     */
    subscribeToEvents() {
        this.eventBus.subscribe(EVENTS.STARTMENU_OPENED, () => {
            this.startButton.classList.add('active');
        });
        
        this.eventBus.subscribe(EVENTS.STARTMENU_CLOSED, () => {
            this.startButton.classList.remove('active');
        });
        
        this.eventBus.subscribe(EVENTS.WINDOW_CREATED, () => {
            this.updateTaskbarLayout();
        });
        
        this.eventBus.subscribe(EVENTS.WINDOW_CLOSED, () => {
            this.updateTaskbarLayout();
        });
    }
    
    /**
     * Set up hover and click effects for start button
     */
    setupStartButtonEffects() {
        this.startButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.eventBus.publish(EVENTS.STARTMENU_TOGGLE);
        });
    }
    
    /**
     * Set up event handlers for tray icons
     */
    setupTrayIconEvents() {
        // Add click event to MSN Messenger icon
        const messengerIcon = document.querySelector('.tray-status-icon');
        if (messengerIcon) {
            messengerIcon.addEventListener('click', () => {
                this.eventBus.publish(EVENTS.PROGRAM_OPEN, { programName: 'messenger' });
            });
        }
    }

    /**
     * Setup responsive taskbar that adjusts program item widths based on available space
     */
    setupResponsiveTaskbar() {
        this.updateTaskbarLayout();
        
        window.addEventListener('resize', () => {
            this.updateTaskbarLayout();
        });
        
        const observer = new MutationObserver(() => {
            this.updateTaskbarLayout();
        });
        
        observer.observe(this.programsContainer, {
            childList: true,
            subtree: false
        });
    }
    
    /**
     * Updates the taskbar layout, adjusting program item widths based on available space
     */
    updateTaskbarLayout() {
        const taskbarItems = document.querySelectorAll('.taskbar-item');
        if (taskbarItems.length === 0) return;
        
        const taskbarWidth = document.querySelector('.taskbar').offsetWidth;
        const startButtonWidth = this.startButton.offsetWidth;
        const quickLaunchWidth = document.querySelector('.quick-launch')?.offsetWidth || 0;
        const systemTrayWidth = this.systemTray.offsetWidth;
        
        // Calculate available width with a fixed right margin
        const availableWidth = taskbarWidth - startButtonWidth - quickLaunchWidth - systemTrayWidth - 30;
        
        // When relayouting programs, ensure the last program has consistent spacing to system tray
        this.programsContainer.style.justifyContent = 'flex-start';
        
        const defaultWidth = 160;
        const minTextWidth = 80; // Minimum width with visible text
        const iconOnlyWidth = 36; // Width for icon-only mode (icon + padding)
        
        // Calculate the minimum total width needed for all items
        let totalWidth = 0;
        const itemCount = taskbarItems.length;
        
        // Priority-based approach:
        if (itemCount * defaultWidth <= availableWidth) {
            // Case 1: Plenty of space - use default width
            totalWidth = itemCount * defaultWidth;
            
            taskbarItems.forEach(item => {
                item.style.display = 'flex';
                item.style.minWidth = `${defaultWidth}px`;
                item.style.maxWidth = `${defaultWidth}px`;
                item.style.width = `${defaultWidth}px`;
                item.classList.remove('icon-only');
            });
        } 
        else if (itemCount * minTextWidth <= availableWidth) {
            // Case 2: Space for text but reduced width
            // Calculate exact width to fit all items
            const itemWidth = Math.floor(availableWidth / itemCount);
            totalWidth = itemWidth * itemCount;
            
            taskbarItems.forEach(item => {
                item.style.display = 'flex';
                item.style.minWidth = `${itemWidth}px`;
                item.style.maxWidth = `${itemWidth}px`;
                item.style.width = `${itemWidth}px`;
                item.classList.remove('icon-only');
            });
        }
        else if (itemCount * iconOnlyWidth <= availableWidth) {
            // Case 3: Only enough space for icon-only mode
            const itemWidth = Math.floor(availableWidth / itemCount);
            totalWidth = itemWidth * itemCount;
            
            taskbarItems.forEach(item => {
                item.style.display = 'flex';
                item.style.minWidth = `${itemWidth}px`;
                item.style.maxWidth = `${itemWidth}px`;
                item.style.width = `${itemWidth}px`;
                item.classList.add('icon-only');
            });
        }
        else {
            // Case 4: Not even enough space for icon-only mode
            // Calculate how many items can fit at minimum icon width
            const maxItems = Math.floor(availableWidth / iconOnlyWidth);
            totalWidth = maxItems * iconOnlyWidth;
            
            // Apply icon-only mode to all items that fit
            taskbarItems.forEach((item, index) => {
                if (index < maxItems) {
                    item.style.display = 'flex';
                    item.style.minWidth = `${iconOnlyWidth}px`;
                    item.style.maxWidth = `${iconOnlyWidth}px`;
                    item.style.width = `${iconOnlyWidth}px`;
                    item.classList.add('icon-only');
                } else {
                    // Hide the rest
                    item.style.display = 'none';
                }
            });
        }
        
        // Final safety check - ensure total width is never more than available
        if (totalWidth > availableWidth) {
            const adjustedWidth = Math.floor(availableWidth / taskbarItems.length);
            
            taskbarItems.forEach(item => {
                if (item.style.display !== 'none') {
                    item.style.minWidth = `${adjustedWidth}px`;
                    item.style.maxWidth = `${adjustedWidth}px`;
                    item.style.width = `${adjustedWidth}px`;
                }
            });
        }
    }
}
