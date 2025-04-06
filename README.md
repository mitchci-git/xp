# Windows XP Simulation v2 - Asset Guidelines

This document outlines the recommended placement, naming conventions, and dimensions for assets used in the simulation. Following these guidelines helps maintain consistency and ensures assets are loaded correctly by the components.

## Asset Directory Structure & Files

Simulation-wide assets are placed within the `/assets/` directory. Assets specific to a standalone application should reside within that application's own folder in `/apps/` (e.g., `/apps/my-app/assets/`).

```
/assets/              # Simulation-wide assets
├── gui/
│   ├── desktop/
│   │   ├── bliss.jpg
│   │   ├── cmd-prompt.png
│   │   ├── email.png
│   │   ├── image-viewer.png
│   │   ├── internet-explorer.png
│   │   ├── messenger.png
│   │   ├── my-computer.png
│   │   ├── my-documents.png
│   │   ├── my-pictures.png
│   │   └── recycle-bin.png
│   ├── start-menu/
│   │   ├── arrow.ico
│   │   ├── computer.png
│   │   ├── documents.png
│   │   ├── email.png
│   │   ├── github.png
│   │   ├── instagram.png
│   │   ├── internet.png
│   │   ├── linkedin.png
│   │   ├── logoff.png
│   │   ├── messenger.png
│   │   ├── pictures.png
│   │   ├── shutdown.png
│   │   └── user.png
│   ├── taskbar/
│   │   ├── network.png
│   │   ├── start-button.png
│   │   ├── status.png
│   │   ├── system-tray.png
│   │   ├── taskbar-bg.png
│   │   └── volume.png
│   └── effects/
│       └── noise.png 
/apps/                # Standalone applications
└── cmd-prompt/ 
    └── # (No specific assets needed currently)
    # Example App with Assets:
    # my-app/
    # ├── index.html
    # ├── script.js
    # ├── styles.css
    # └── assets/
    #     └── specific-image.png 
```
*(Note: `/assets/gui/windows/` directory not found)*

## Naming Conventions

*   Use lowercase letters.
*   Separate words with hyphens (`-`).
*   Be descriptive (e.g., `internet-explorer.png`, `start-button.png`, `taskbar-bg.png`).
*   For program icons used in multiple places (desktop, start menu, window title bar), use a consistent base name (e.g., `my-computer.png`, `email.png`) and place them in `/assets/gui/desktop/`.

## Recommended Dimensions (Pixel Sizes)

*   **Desktop Icons (`assets/gui/desktop/`):**
    *   Image File: `40x40` (The CSS centers this).
*   **Start Menu Icons (`assets/gui/start-menu/`):**
    *   Main Program Icons (Left): `30x30`
    *   Other/Right Side Icons: `25x25`
    *   User Picture: `40x40`
    *   Footer Icons (Log Off/Shut Down): `24x24`
    *   All Programs Arrow: `18x18`
*   **Taskbar Icons (`assets/gui/taskbar/`):**
    *   Program Icons (in `.taskbar-item`): `16x16`
    *   System Tray Icons: `16x16` (approx).
*   **Window Title Bar Icons (Referenced from `programData.js`):**
    *   Typically `16x16` (matched with taskbar icons).
*   **Folder View Icons (e.g., within My Computer/Documents):**
    *   If using `.folder-item` CSS: `32x32` recommended.

**Notes:**

*   Dimensions are recommendations based on current CSS.
*   Using consistent dimensions improves visual alignment.
*   Use appropriate file formats (`.png` for transparency, `.jpg` for backgrounds). 