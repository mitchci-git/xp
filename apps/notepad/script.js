import { setupIframeActivation } from '../../scripts/utils/iframeManager.js'; // Import standard helper

document.addEventListener('DOMContentLoaded', function() {
    const staticContent = document.getElementById('static-content');
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
    
    // Position cursor at the end of the text
    positionCursorAtEnd();
    
    function positionCursorAtEnd() {
        // We would normally do this with actual caret positioning,
        // but since we're using a static div, we're just ensuring our 
        // blinking cursor appears at the end visually
    }
    
    function updateStatusBar() {
        // For static content, we can just set a fixed value or calculate based on the content
        const content = staticContent.textContent;
        const lines = content.split('\n');
        const lastLine = lines[lines.length - 1];
        
        // Update status bar to show the cursor is at the end of the text
        statusLnCol.textContent = `Ln ${lines.length}, Col ${lastLine.length + 1}`;
    }
    
    function setupMenus() {
        // Menu item click handlers
        menuItems.forEach(item => {
            item.addEventListener('click', function(e) {
                const menuType = this.getAttribute('data-menu');
                
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
            case 'Copy':
                // Create a range and copy the static content
                const range = document.createRange();
                range.selectNode(staticContent);
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(range);
                document.execCommand('copy');
                window.getSelection().removeAllRanges();
                break;
                
            case 'Select All':
                // Create a range and select the static content
                const allRange = document.createRange();
                allRange.selectNode(staticContent);
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(allRange);
                break;
                
            case 'Exit':
                if (window.parent && window.parent !== window) {
                    // Get windowId from URL query parameters
                    const params = new URLSearchParams(window.location.search);
                    const windowId = params.get('windowId');
                    window.parent.postMessage({
                        type: 'close-window',
                        windowId: windowId, // Include windowId
                        payload: null,
                        timestamp: Date.now()
                    }, window.origin); // Use specific origin
                }
                break;
                
            case 'About Notepad':
                alert('Windows XP Notepad\nVersion 5.1\n\n© Microsoft Corporation. All rights reserved.');
                break;
                
            default:
                // For most menu items in read-only mode, just show a message
                if (action.endsWith('...')) {
                    alert(`${action} functionality is not available in this demo.`);
                }
                break;
        }
    }
}); 