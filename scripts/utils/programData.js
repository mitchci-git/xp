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
    // "internet-explorer": { // Renaming and repurposing for Projects
    //     id: "internet-explorer-window",
    //     title: "Internet Explorer", 
    //     icon: "./assets/gui/desktop/internet-explorer.png",
    //     template: "iframe-standard",
    //     appPath: "./apps/internet-explorer/index.html",
    //     dimensions: {
    //         width: 800,
    //         height: 600
    //     }
    // },
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
        }
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
        title: "My Portfolio Projects", // Updated title
        icon: "./assets/gui/desktop/internet-explorer.png", // Using IE icon
        template: "iframe-standard",
        appPath: "apps/projects/index.html", // Correct path
        dimensions: {
            width: 950, // Larger default size for projects
            height: 720
        }
    },
    "retro-os-details": { // New entry for the detail page
        id: "retro-os-details-window",
        title: "Project Details: Retro OS", 
        icon: "./assets/gui/desktop/internet-explorer.png", // Reuse icon or use specific one
        template: "iframe-standard",
        appPath: "apps/projects/retro-os-details/index.html", // Path to the detail page HTML
        dimensions: {
            width: 950, 
            height: 720
        }
    }
};

export default programData;
