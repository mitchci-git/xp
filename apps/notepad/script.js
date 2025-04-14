import { setupIframeActivation } from '../../scripts/utils/iframeManager.js'; // Import standard helper

document.addEventListener('DOMContentLoaded', function() {
    const notepadEditor = document.getElementById('notepad-editor');
    const statusLnCol = document.querySelector('.status-item:first-child');
    const menuItems = document.querySelectorAll('.menu-item');
    const dropdownMenus = document.querySelectorAll('.dropdown-menu');
    let activeMenu = null;
    
    // Setup menu interactions
    setupMenus();
    
    // Initialize the status bar
    updateStatusBar();
    
    // Setup inter-frame communication with parent window
    setupIframeActivation(); // Use standard activation helper
    
    // Set focus to the editor
    notepadEditor.focus();
    
    // Update status bar when cursor position changes
    notepadEditor.addEventListener('keyup', updateStatusBar);
    notepadEditor.addEventListener('click', updateStatusBar);
    notepadEditor.addEventListener('select', updateStatusBar);
    
    function updateStatusBar() {
        const content = notepadEditor.value;
        const cursorPos = notepadEditor.selectionStart;
        
        // Calculate line and column based on cursor position
        const lines = content.substring(0, cursorPos).split('\n');
        const currentLine = lines.length;
        const currentCol = lines[lines.length - 1].length + 1;
        
        // Update status bar
        statusLnCol.textContent = `Ln ${currentLine}, Col ${currentCol}`;
    }
    
    function setupMenus() {
        // Menu item click handlers
        menuItems.forEach(item => {
            item.addEventListener('click', function(e) {
                const menuType = this.getAttribute('data-menu');
                
                // Skip disabled menu items
                if (menuType === 'edit' || menuType === 'format' || 
                    menuType === 'view' || menuType === 'help') {
                    return;
                }
                
                // Close any open menu
                if (activeMenu && activeMenu !== menuType) {
                    closeAllMenus();
                }
                
                // Toggle the clicked menu
                const menu = document.getElementById(`${menuType}-menu`);
                
                if (menu.classList.contains('show')) {
                    closeAllMenus();
                } else {
                    // Show this menu
                    closeAllMenus();
                    menu.classList.add('show');
                    this.classList.add('active');
                    activeMenu = menuType;
                }
                
                e.stopPropagation();
            });
        });
        
        // Menu option click handlers
        document.querySelectorAll('.menu-option').forEach(option => {
            option.addEventListener('click', function(e) {
                const action = this.textContent;
                
                // Only allow New and Exit actions from File menu
                if (action !== 'New' && action !== 'Exit' && 
                    !action.includes('Notepad')) {
                    return;
                }
                
                handleMenuAction(action);
                closeAllMenus();
                e.stopPropagation();
            });
        });
        
        // Close menus when clicking outside
        document.addEventListener('click', function() {
            closeAllMenus();
        });
        
        // Prevent menu from closing when clicking inside a menu
        dropdownMenus.forEach(menu => {
            menu.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        });
    }
    
    function closeAllMenus() {
        dropdownMenus.forEach(menu => {
            menu.classList.remove('show');
        });
        
        menuItems.forEach(item => {
            item.classList.remove('active');
        });
        
        activeMenu = null;
    }
    
    function handleMenuAction(action) {
        switch(action) {
            case 'New':
                const dialog = document.getElementById('xp-dialog');
                if (dialog) {
                    dialog.showModal(); // Directly show the dialog when 'New' is clicked
                } else {
                    console.error('Dialog element not found.');
                }
                break;
                
            case 'Copy':
                document.execCommand('copy');
                break;
                
            case 'Cut':
                document.execCommand('cut');
                break;
                
            case 'Paste':
                document.execCommand('paste');
                break;
                
            case 'Select All':
                notepadEditor.select();
                break;
                
            case 'Time/Date':
                const now = new Date();
                const timeDate = now.toLocaleTimeString() + ' ' + now.toLocaleDateString();
                
                // Insert at cursor position
                const cursorPos = notepadEditor.selectionStart;
                const textBefore = notepadEditor.value.substring(0, cursorPos);
                const textAfter = notepadEditor.value.substring(notepadEditor.selectionEnd);
                
                notepadEditor.value = textBefore + timeDate + textAfter;
                notepadEditor.selectionStart = notepadEditor.selectionEnd = cursorPos + timeDate.length;
                notepadEditor.focus();
                updateStatusBar();
                break;
                
            case 'Exit':
                if (window.parent && window.parent !== window) {
                    // Get windowId from URL query parameters
                    const params = new URLSearchParams(window.location.search);
                    const windowId = params.get('windowId');
                    window.parent.postMessage({
                        type: 'close-window',
                        windowId: windowId, 
                        payload: null,
                        timestamp: Date.now()
                    }, window.origin);
                }
                break;
                
            case 'About Notepad':
                alert('Windows XP Notepad\nVersion 5.1\n\n© Microsoft Corporation. All rights reserved.');
                break;
                
            default:
                // For most menu items, just show a message
                if (action.endsWith('...')) {
                    alert(`${action} functionality is not available in this demo.`);
                }
                break;
        }
    }
    
    // Setup XP-style dialog
    let checkButtonState; // Declare the function reference at a higher scope
    
    function setupXPDialog() {
        const dialog = document.getElementById('xp-dialog');
        const closeBtn = dialog.querySelector('[data-action="close"]');
        const realYesBtn = document.getElementById('xp-dialog-ok');
        const fakeYesBtn = document.getElementById('fake-disabled-yes');
        const noBtn = document.getElementById('xp-dialog-no');

        // Setup close button
        closeBtn.addEventListener('click', () => {
            dialog.close();
        });

        // Setup real Yes button - saves changes and clears the document
        realYesBtn.addEventListener('click', () => {
            dialog.close();
            clearNotepad();
        });

        // Setup No button
        noBtn.addEventListener('click', () => {
            dialog.close();
            clearNotepad();
        });
    }

    function showXPDialog() {
        const dialog = document.getElementById('xp-dialog');
        const realYesBtn = document.getElementById('xp-dialog-ok');
        const fakeYesBtn = document.getElementById('fake-disabled-yes');
        const notepadWindow = document.querySelector('.notepad-container .window');

        // Check if the document has been modified
        const isEmpty = notepadEditor.value.trim() === '';
        
        // CRITICAL CHANGE: Show either the real or fake button based on content
        if (isEmpty) {
            // When empty - show fake disabled button, hide real button
            realYesBtn.style.display = 'none';
            fakeYesBtn.style.display = 'block';
        } else {
            // When there's content - show real clickable button, hide fake button
            realYesBtn.style.display = 'block';
            fakeYesBtn.style.display = 'none';
        }
        
        // Function to toggle between the buttons based on content
        const updateButtonState = () => {
            const isEmpty = notepadEditor.value.trim() === '';
            if (isEmpty) {
                realYesBtn.style.display = 'none';
                fakeYesBtn.style.display = 'block';
            } else {
                realYesBtn.style.display = 'block';
                fakeYesBtn.style.display = 'none';
            }
        };
        
        // Listen for input changes to update the button state
        notepadEditor.addEventListener('input', updateButtonState);

        // Set the Notepad window to inactive state
        notepadWindow.classList.remove('active');
        notepadWindow.classList.add('inactive');

        // Set the dialog as the active window
        dialog.classList.add('active');

        dialog.showModal();

        // Restore the Notepad window to active state when the dialog is closed
        dialog.addEventListener('close', () => {
            notepadWindow.classList.remove('inactive');
            notepadWindow.classList.add('active');
            dialog.classList.remove('active');
            
            // Remove the input listener when dialog is closed
            notepadEditor.removeEventListener('input', updateButtonState);
        }, { once: true });
    }

    function clearNotepad() {
        notepadEditor.value = '';
        updateStatusBar();
        notepadEditor.focus();
    }

    // Initialize the XP dialog
    setupXPDialog();
});