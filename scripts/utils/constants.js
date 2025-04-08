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

    // Taskbar/Start Menu
    TASKBAR_ITEM_CLICKED: 'taskbar:item:clicked',
    STARTMENU_TOGGLE: 'startmenu:toggle',
    STARTMENU_OPENED: 'startmenu:opened',
    STARTMENU_CLOSED: 'startmenu:closed',
    STARTMENU_CLOSE_REQUEST: 'startmenu:close-request',
    
    // Desktop

    // Effects
    CRT_TOGGLE: 'crt:toggle',
    CRT_UPDATE_SETTINGS: 'crt:update-settings',
    
    // Inter-app/Iframe Communication (Example)
    IFRAME_CLICKED: 'iframe-clicked',
    // Add other app-specific or general communication events here
};

// Add other constants as needed, e.g., CSS class names, default values 