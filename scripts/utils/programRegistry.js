/**
 * Program configuration for all available applications in the Windows XP simulation
 */

// Default properties to use as templates
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

// Generate standard ID from program name
const makeId = name => `${name}-window`;

// Base app path
const appPath = "./apps/";

// Create program config with consistent properties
const createProgram = (key, title, icon, path, extraProps = {}) => ({
    id: makeId(key),
    title,
    icon: `./assets/gui/${icon}`,
    ...defaults.iframe,
    appPath: `${appPath}${path}/index.html`,
    ...extraProps
});

const programData = {
    "msn-messenger": createProgram(
        "msn-messenger",
        "MSN Messenger",
        "start-menu/msn-messenger.webp",
        "msn-messenger",
        { dimensions: { width: 280, height: 500 }}
    ),
    "help-support": createProgram(
        "help-support",
        "Help and Support",
        "start-menu/help.webp",
        "help-support", 
        { dimensions: { width: 750, height: 550 }}
    ),
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
        "Resume",
        "desktop/resume.webp",
        "resume-pdf",
        { dimensions: { width: 800, height: 600 }}
    ),
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
    "cmd-prompt": createProgram(
        "cmd-prompt", 
        "Command Prompt", 
        "start-menu/command-prompt.webp", 
        "cmd-prompt", 
        { initialHeight: 600 }
    ),
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
    },
    "notepad": createProgram(
        "notepad", 
        "Notes", 
        "start-menu/notepad.webp", 
        "notepad"
    )
};

export default programData;
