/**
 * EventBus - Communication system implementing a publish-subscribe pattern
 * for decoupled interaction between components of the XP simulation
 */

/**
 * Centralized event names for the application
 */
export const EVENTS = {
    // Window Management Events
    PROGRAM_OPEN: 'program:open',
    PROGRAM_CLOSE: 'program:close',
    PROGRAM_MINIMIZE: 'programMinimize',
    PROGRAM_MAXIMIZE: 'programMaximize',
    PROGRAM_UNMAXIMIZE: 'programUnmaximize',
    WINDOW_CREATED: 'window:created',
    WINDOW_CLOSED: 'window:closed',
    WINDOW_FOCUSED: 'window:focused',
    WINDOW_MINIMIZED: 'window:minimized',
    WINDOW_MAXIMIZED: 'window:maximized',
    WINDOW_UNMAXIMIZED: 'window:unmaximized',
    WINDOW_RESTORED: 'window:restored',
    WINDOW_DRAG_START: 'window:drag:start',
    WINDOW_RESIZE_START: 'window:resize:start',

    // UI Control Events
    TASKBAR_ITEM_CLICKED: 'taskbar:item:clicked',
    TASKBAR_UPDATE: 'taskbar:update',
    STARTMENU_TOGGLE: 'startmenu:toggle',
    STARTMENU_OPENED: 'startmenu:opened',
    STARTMENU_CLOSED: 'startmenu:closed',
    STARTMENU_CLOSE_REQUEST: 'startmenu:close-request',
    LOG_OFF_REQUESTED: 'logoff:requested',
    
    // Cross-frame Communication
    IFRAME_CLICKED: 'iframe-clicked',
};

class EventBus {
    constructor() {
        this.events = {};
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {function} callback - Function to call when event is triggered
     * @returns {function} Unsubscribe function for easy cleanup
     */
    subscribe(event, callback) {
        (this.events[event] ??= []).push(callback);
        return () => this.unsubscribe(event, callback);
    }

    /**
     * Subscribe to an event and automatically unsubscribe after first trigger
     * @param {string} event - Event name  
     * @param {function} callback - Function to call when event is triggered
     */
    once(event, callback) {
        const onceCallback = (...args) => {
            this.unsubscribe(event, onceCallback);
            callback(...args);
        };
        this.subscribe(event, onceCallback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {function} callback - Function to unsubscribe
     */
    unsubscribe(event, callback) {
        this.events[event]?.length && 
        (this.events[event] = this.events[event].filter(cb => cb !== callback));
    }

    /**
     * Publish an event to all subscribers
     * @param {string} event - Event name
     * @param {any} data - Data to pass to subscribers
     */
    publish(event, data) {
        this.events[event]?.forEach(callback => callback(data));
    }
}

// Create and export a singleton instance
export const eventBus = new EventBus();
