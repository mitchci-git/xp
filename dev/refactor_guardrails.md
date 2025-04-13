IGNORE FOR NOW

# XP Simulation – Refactor Guardrails

## Primary Directives:
- **Do not break the visual UX or layout structure under any circumstances.**
- **Window behavior (z-index, movement, resizing, overlays) must remain pixel-perfect.**
- **Start Menu, Taskbar, System Tray, MSN popup, and all apps must appear and function exactly as they do now.**

## Immutable Systems:
- `windowManager.js` — critical, fragile, only clean internal logic, no restructuring
- `eventBus.js` — backbone for communication, changing timing/events will cause widespread breaks
- `iframePreloader.js` — handles performance-sensitive behavior, changes = visual lag
- `programRegistry.js` — tightly coupled to start menu, windowManager, preloader
- `main.js` and boot sequence — must initialize perfectly, no delays, no UI flash glitches

## Known Workarounds (DO NOT REMOVE):
- iframe overlay during drag to prevent input bleed-through
- hardcoded `TASKBAR_HEIGHT` for vertical pixel accuracy
- z-index stack hardcoded for visual layer integrity

## Cleaning Allowed:
- Internal logic cleanup (naming, formatting, dead code)
- Comments and documentation
- Isolated logic refactors with exact output preservation
- Non-core files (basic apps, helper utilities)

## Updated Guardrails
- Documented additional constraints for app-specific files.
- Clarified the scope of permissible changes for helper utilities.

