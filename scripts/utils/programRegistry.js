/**
 * @fileoverview Program Registry for the Windows XP simulation
 * 
 * Defines configuration data for all available applications including window properties,
 * dimensions, icons, and content sources. This centralized registry ensures consistent
 * program initialization throughout the application.
 * 
 * @module programRegistry
 */

// Default properties to use as templates
/**
 * Default configuration templates for program properties
 * 
 * @constant
 * @type {Object}
 */
const defaults = {
    iframe: {
        template: "iframe-standard",
        dimensions: { width: 600, height: 400 }
    },
    window: {
        canMaximize: true,
        canMinimize: true,
        canClose: true
    }
};

/**
 * Generates a standardized window ID from program name
 * 
 * @param {string} name - Program name
 * @returns {string} Formatted window ID
 */
const makeId = name => `${name}-window`;

/**
 * Base path for application content
 * 
 * @constant
 * @type {string}
 */
const appPath = "./apps/";

/**
 * Creates a program configuration with consistent properties
 * 
 * @param {string} key - Unique program identifier
 * @param {string} title - Window title displayed in titlebar
 * @param {string} icon - Relative path to program icon
 * @param {string} path - Path to application directory (relative to apps/)
 * @param {Object} [extraProps={}] - Additional program-specific properties
 * @returns {Object} Complete program configuration object
 */
const createProgram = (key, title, icon, path, extraProps = {}) => ({
    id: makeId(key),
    title,
    icon: `./assets/gui/${icon}`,
    ...defaults.iframe,
    appPath: `${appPath}${path}/index.html`,
    ...extraProps
});

/**
 * Complete registry of all application configurations
 * 
 * Each entry defines the properties needed to create and manage a program window,
 * including dimensions, content source, and UI behavior.
 * 
 * @type {Object.<string, Object>}
 */
const programData = {
    // Communication and Messaging
    "msn-messenger": createProgram(
        "msn-messenger",
        "MSN Messenger",
        "start-menu/msn-messenger.webp",
        "msn-messenger",
        { dimensions: { width: 280, height: 500 }}
    ),
    
    // System and Utility Programs
    "help-support": createProgram(
        "help-support",
        "Help and Support",
        "start-menu/help.webp",
        "help-support", 
        { dimensions: { width: 750, height: 550 }}
    ),
    "cmd-prompt": createProgram(
        "cmd-prompt", 
        "Command Prompt", 
        "start-menu/command-prompt.webp", 
        "cmd-prompt", 
        { initialHeight: 600 }
    ),
    "notepad": createProgram(
        "notepad", 
        "Notepad", 
        "start-menu/notepad.webp", 
        "notepad"
    ),
    
    // Portfolio Content
    "about-me": createProgram(
        "about-me",
        "About Me",
        "desktop/about-me.webp",
        "about-me",
        { dimensions: { width: 750, height: 550 }}
    ),
    "contact-me": createProgram(
        "contact-me",
        "Contact Me",
        "desktop/email.webp",
        "contact-me",
        { dimensions: { width: 600, height: 450 }}
    ),
    "resume-pdf": createProgram(
        "resume-pdf",
        "Resume.pdf",
        "desktop/resume.webp",
        "resume-pdf",
        { dimensions: { width: 700, height: 800 }}
    ),

    // Media Programs
    "music-player": createProgram(
        "music-player",
        "Music Player",
        "start-menu/music-player.webp",
        "music-player",
        { dimensions: { width: 500, height: 350 }}
    ),
    "my-pictures": createProgram(
        "my-pictures", 
        "Photo Viewer", 
        "start-menu/photo-viewer.webp", 
        "photo-viewer", 
        { dimensions: { width: 875, height: 675 }}
    ),
    
    // Project Showcase Programs
    "my-projects": createProgram(
        "my-projects", 
        "My Projects", 
        "desktop/my-projects.webp", 
        "my-projects", 
        { dimensions: { width: 950, height: 775 }}
    ),
    "retro-os-details": createProgram(
        "retro-os-details", 
        "Project Details: Retro OS", 
        "start-menu/internet.webp", 
        "my-projects/retro-os-details", 
        { dimensions: { width: 950, height: 720 }}
    ),
    
    // Special format entries with custom properties
    "retro-os": {
        title: "Project Hub",
        icon: "./assets/gui/start-menu/internet.webp",
        isApp: true,
        appPath: `${appPath}my-projects/index.html`,
        ...defaults.window,
        initialWidth: 800,
        initialHeight: 600,
    },
    "video-tab": {
        title: "Videos",
        icon: "./assets/gui/icons/video.webp",
        isApp: false,
        appPath: `${appPath}my-projects/videos/index.html`,
        ...defaults.window
    },
    "images-tab": {
        title: "Image Gallery",
        icon: "./assets/gui/start-menu/photo-viewer.webp",
        isApp: false,
        appPath: `${appPath}my-projects/images/index.html`,
        ...defaults.window
    },
    "code-tab": {
        title: "Code Repos",
        icon: "./assets/gui/icons/code.webp",
        isApp: false,
        appPath: `${appPath}my-projects/code/index.html`,
        ...defaults.window
    }
};

export default programData;
