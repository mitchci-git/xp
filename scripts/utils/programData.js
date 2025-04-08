/**
 * Program configuration for all available applications in the Windows XP simulation
 */
const programData = {
    "my-computer": {
        id: "my-computer-window",
        title: "My Computer",
        icon: "./assets/gui/desktop/my-computer.png",
        template: "my-computer",
        dimensions: {
            width: 600,
            height: 400
        }
    },
    "my-documents": {
        id: "my-documents-window",
        title: "My Documents",
        icon: "./assets/gui/desktop/my-documents.png",
        template: "folder-view",
        dimensions: {
            width: 600,
            height: 400
        }
    },
    "recycle-bin": {
        id: "recycle-bin-window",
        title: "Recycle Bin",
        icon: "./assets/gui/desktop/recycle-bin.png",
        template: "folder-view",
        dimensions: {
            width: 600,
            height: 400
        }
    },
    "email": {
        id: "email-window",
        title: "New Message - Outlook Express",
        icon: "./assets/gui/desktop/email.png",
        template: "iframe-standard",
        appPath: "./apps/email/index.html",
        dimensions: {
            width: 650,
            height: 500
        }
    },
    "messenger": {
        id: "messenger-window",
        title: "Windows Messenger",
        icon: "./assets/gui/desktop/messenger.png",
        template: "iframe-standard",
        appPath: "./apps/messenger/index.html",
        dimensions: {
            width: 600,
            height: 400
        },
        position: {
            type: "custom",
            align: "left-of-browser-top",
            offsetX: 50,
            offsetY: 0
        },
        startMinimized: true
    },
    "my-pictures": {
        id: "my-pictures-window",
        title: "My Pictures",
        icon: "./assets/gui/desktop/my-pictures.png",
        template: "iframe-standard",
        appPath: "apps/my-pictures/index.html",
        dimensions: {
            width: 900,
            height: 700
        }
    },
    "image-viewer": {
        id: "image-viewer-window",
        title: "Windows Photo Viewer",
        icon: "./assets/gui/desktop/image-viewer.png",
        template: "iframe-standard",
        appPath: "./apps/image-viewer/index.html"
    },
    "cmd-prompt": {
        id: "cmd-prompt-window",
        title: "Command Prompt",
        icon: "./assets/gui/desktop/command-prompt.png",
        template: "iframe-standard",
        appPath: "./apps/cmd-prompt/index.html",
        dimensions: {
            width: 600,
            height: 400
        }
    },
    "projects": { // New entry for Projects using IE concept
        id: "projects-window",
        title: "Projects Hub - Internet Explorer", // Updated title
        icon: "./assets/gui/desktop/internet-explorer.png", // Using IE icon
        template: "iframe-standard",
        appPath: "apps/internet-explorer/index.html", // Correct path
        dimensions: {
            width: 1000, // Updated width
            height: 850 // Changed from 950px to 850px
        },
        position: {
            type: "custom",
            align: "center", // Changed from center-right
            offsetY: 0
        },
        startMinimized: true
    },
    "retro-os-details": { // New entry for the detail page
        id: "retro-os-details-window",
        title: "Project Details: Retro OS", 
        icon: "./assets/gui/desktop/internet-explorer.png", // Reuse icon or use specific one
        template: "iframe-standard",
        appPath: "apps/internet-explorer/retro-os-details/index.html", // Path to the detail page HTML
        dimensions: {
            width: 950, 
            height: 720
        }
    },
    "retro-os": {
        title: "Project Hub",
        icon: "./assets/gui/icons/my-documents.png", // Example icon
        isApp: true,
        appPath: "apps/internet-explorer/index.html", // Correct path
        canMaximize: true,
        canMinimize: true,
        canClose: true,
        initialWidth: 800, // Default or specific width
        initialHeight: 600, // Default or specific height
        // Removed lightbox configuration here
    },
    "video-tab": {
        title: "Videos",
        icon: "./assets/gui/icons/video.png", // Specific icon
        isApp: false, // It's content loaded into a window
        appPath: "apps/internet-explorer/videos/index.html",
        canMaximize: true,
        canMinimize: true,
        canClose: true,
    },
    "images-tab": {
        title: "Image Gallery",
        icon: "./assets/gui/icons/images.png", // Specific icon
        isApp: false,
        appPath: "apps/internet-explorer/images/index.html",
        canMaximize: true,
        canMinimize: true,
        canClose: true,
    },
    "code-tab": {
        title: "Code Repos",
        icon: "./assets/gui/icons/code.png", // Specific icon
        isApp: false,
        appPath: "apps/internet-explorer/code/index.html",
        canMaximize: true,
        canMinimize: true,
        canClose: true,
    },
    "notepad": {
        id: "notepad-window",
        title: "About Me - Notepad",
        icon: "./assets/gui/desktop/notepad.png",
        template: "iframe-standard",
        appPath: "./apps/notepad/index.html",
        dimensions: {
            width: 600,
            height: 400
        },
        position: {
            type: "custom",
            align: "left-of-browser",
            offsetX: 50, // 50px space between browser left edge and notepad right edge
            offsetY: 0
        },
        startMinimized: true
    }
    // Add other project/content definitions here...
};

export default programData;
