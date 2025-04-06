/**
 * Shared constants for the application
 */

export const EVENTS = {
    // Program/Window Lifecycle
    PROGRAM_OPEN: 'program:open',
    WINDOW_CREATED: 'window:created',
    WINDOW_CLOSED: 'window:closed',
    WINDOW_FOCUSED: 'window:focused',
    WINDOW_MINIMIZED: 'window:minimized',
    WINDOW_MAXIMIZED: 'window:maximized',
    WINDOW_UNMAXIMIZED: 'window:unmaximized',
    WINDOW_RESTORED: 'window:restored',
    WINDOW_RESIZE: 'window:resize', // Potentially useful later

    // Taskbar/Start Menu
    TASKBAR_ITEM_CLICKED: 'taskbar:item:clicked',
    STARTMENU_TOGGLE: 'startmenu:toggle',
    STARTMENU_OPENED: 'startmenu:opened',
    STARTMENU_CLOSED: 'startmenu:closed',
    
    // Desktop
    DESKTOP_CLICKED: 'desktop:clicked', // Potentially useful later

    // Effects
    CRT_TOGGLE: 'crt:toggle',
    CRT_UPDATE_SETTINGS: 'crt:update-settings',

    // Clock
    CLOCK_UPDATE: 'clock:update',
    CLOCK_TIME_CHANGED: 'clock:time-changed',
    
    // Inter-app/Iframe Communication (Example)
    IFRAME_CLICKED: 'iframe-clicked',
    // Add other app-specific or general communication events here
};

// Add other constants as needed, e.g., CSS class names, default values 