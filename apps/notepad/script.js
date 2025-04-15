import { setupIframeActivation } from '../../scripts/utils/iframeManager.js'; // Import standard helper

document.addEventListener('DOMContentLoaded', function() {
    const notepadEditor = document.getElementById('notepad-editor');
    const statusLnCol = document.querySelector('.status-item:first-child');
    const menuItems = document.querySelectorAll('.menu-item');
    const dropdownMenus = document.querySelectorAll('.dropdown-menu');
    let activeMenu = null;
    let currentDialogId = null;
    
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
                // Remove any existing popup
                const existing = document.getElementById('xp-demo-popup');
                if (existing) existing.remove();
                // Add inactive mask to notepad window
                const notepadWin = document.querySelector('.notepad-container');
                if (notepadWin && !document.getElementById('notepad-inactive-mask')) {
                    const mask = document.createElement('div');
                    mask.id = 'notepad-inactive-mask';
                    mask.style.position = 'fixed';
                    mask.style.top = '0';
                    mask.style.left = '0';
                    mask.style.width = '100vw';
                    mask.style.height = '100vh';
                    mask.style.background = 'rgba(255,255,255,0.35)';
                    mask.style.zIndex = '9999';
                    mask.style.pointerEvents = 'auto';
                    mask.style.cursor = 'default';
                    // Prevent all pointer events to Notepad except popup
                    mask.addEventListener('mousedown', e => e.preventDefault());
                    mask.addEventListener('mouseup', e => e.preventDefault());
                    mask.addEventListener('click', e => e.preventDefault());
                    mask.addEventListener('focus', e => e.preventDefault());
                    document.body.appendChild(mask);
                }
                // Remove focus from any element to prevent flashing caret
                document.activeElement && document.activeElement.blur();
                // Trap focus in popup while open
                setTimeout(() => {
                    if (popup) {
                        const firstBtn = popup.querySelector('button');
                        if (firstBtn) firstBtn.focus();
                    }
                }, 0);
                // Create popup (identical to Contact Me)
                const popup = document.createElement('div');
                popup.id = 'xp-demo-popup';
                // Center relative to notepad window
                const parentWindow = document.querySelector('.notepad-container');
                let left = '50vw', top = '50vh', transform = 'translate(-50%, -50%)';
                if (parentWindow) {
                    const rect = parentWindow.getBoundingClientRect();
                    left = (rect.left + rect.width / 2) + 'px';
                    top = (rect.top + rect.height / 2) + 'px';
                }
                popup.innerHTML = `
                  <div class="window" style="margin: 0; width: 250px; position: fixed; left: ${left}; top: ${top}; transform: ${transform}; z-index: 10000; user-select: none;">
                    <div class="title-bar">
                      <div class="title-bar-text">Confirm New</div>
                      <div class="title-bar-controls">
                        <button aria-label="Close" id="popup-close"></button>
                      </div>
                    </div>
                    <div class="window-body">
                      <p style="user-select: none; text-align: center;">Are you sure? You will lose unsaved changes.</p>
                      <section class="field-row" style="justify-content: center; user-select: none; gap: 10px;">
                        <button id="popup-ok">Yes</button>
                        <button id="popup-cancel">Cancel</button>
                      </section>
                    </div>
                  </div>
                `;
                document.body.appendChild(popup);
                // OK: clear notepad, Cancel/Close: just close popup
                function closePopupAndMask() {
                    popup.remove();
                    const mask = document.getElementById('notepad-inactive-mask');
                    if (mask) mask.remove();
                }
                popup.querySelector('#popup-ok').addEventListener('click', () => {
                    notepadEditor.value = '';
                    updateStatusBar();
                    notepadEditor.focus();
                    closePopupAndMask();
                });
                popup.querySelector('#popup-cancel').addEventListener('click', closePopupAndMask);
                popup.querySelector('#popup-close').addEventListener('click', closePopupAndMask);
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
                
            default:
                // For most menu items, just show a message
                if (action.endsWith('...')) {
                    alert(`${action} functionality is not available in this demo.`);
                }
                break;
        }
    }
    
    function clearNotepad() {
        notepadEditor.value = '';
        updateStatusBar();
        notepadEditor.focus();
    }
});