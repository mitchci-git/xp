/**
 * Start Menu module for Windows XP simulation
 * Handles the start menu display, interaction, and submenus
 */
import { EVENTS } from '../utils/constants.js';

export default class StartMenu {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.startButton = document.getElementById('start-button');
        this.startMenu = null;
        this.allProgramsMenu = null;
        
        this.createStartMenuElement();
        this.setupEventListeners();
        
        this.eventBus.subscribe(EVENTS.STARTMENU_TOGGLE, () => this.toggleStartMenu());
    }
    
    /**
     * Create the start menu DOM element
     */
    createStartMenuElement() {
        const existingMenu = document.querySelector('.startmenu');
        if (existingMenu) {
            existingMenu.parentNode.removeChild(existingMenu);
        }
        
        const startMenu = document.createElement('div');
        startMenu.className = 'startmenu';
        startMenu.innerHTML = this.getMenuTemplate();
        startMenu.style.visibility = 'hidden';
        startMenu.style.opacity = '0';
        
        document.body.appendChild(startMenu);
        this.startMenu = startMenu;
        
        this.setupMenuItems();
        this.createAllProgramsMenu();
    }

    /**
     * Create the All Programs submenu
     */
    createAllProgramsMenu() {
        const existingMenu = document.querySelector('.all-programs-menu');
        if (existingMenu) {
            existingMenu.parentNode.removeChild(existingMenu);
        }
        
        const allProgramsMenu = document.createElement('div');
        allProgramsMenu.className = 'all-programs-menu';
        allProgramsMenu.innerHTML = `
            <ul class="all-programs-items">
                <li class="all-programs-separator"></li>
                <li class="all-programs-item category">
                    <img src="./assets/gui/windows/folder.png" alt="Folder">
                    Windows Accessories
                </li>
                <li class="all-programs-item category">
                    <img src="./assets/gui/windows/folder.png" alt="Folder">
                    Games
                </li>
            </ul>
        `;
        
        document.body.appendChild(allProgramsMenu);
        allProgramsMenu.style.display = 'none';
        this.allProgramsMenu = allProgramsMenu;
    }
    
    /**
     * Get HTML template for the start menu
     */
    getMenuTemplate() {
        return `
            <div class="menutopbar">
                <img src="./assets/gui/start-menu/user.png" alt="User" class="userpicture">
                <span class="username">Mitch's Portfolio</span>
            </div>
            <div class="start-menu-middle">
                <div class="middle-section middle-left">
                    <ul class="menu-items">
                        <li class="menu-item" id="menu-email">
                            <img src="./assets/gui/start-menu/email.png" alt="E-mail">
                            <div class="item-content">
                                <span class="item-title">E-mail</span>
                                <span class="item-description">Outlook Express</span>
                            </div>
                        </li>
                        <li class="menu-item" id="menu-messenger">
                            <img src="./assets/gui/start-menu/messenger.png" alt="Windows Messenger">
                            <div class="item-content">
                                <span class="item-title">Messenger</span>
                                <span class="item-description">Windows Live Messenger</span>
                            </div>
                        </li>
                        <li class="menu-divider"><hr class="divider"></li>
                        <li class="menu-item" id="menu-cmd-prompt">
                            <img src="./assets/gui/start-menu/command-prompt.png" alt="Command Prompt">
                            <div class="item-content">
                                <span class="item-title">Command Prompt</span>
                            </div>
                        </li>
                        <li class="menu-item" id="menu-my-computer">
                            <img src="./assets/gui/start-menu/computer.png" alt="My Computer">
                            <div class="item-content">
                                <span class="item-title">My Computer</span>
                            </div>
                        </li>
                        <li class="menu-item" id="menu-my-documents">
                            <img src="./assets/gui/start-menu/documents.png" alt="My Documents">
                            <div class="item-content">
                                <span class="item-title">My Documents</span>
                            </div>
                        </li>
                        <li class="menu-item" id="menu-my-pictures">
                            <img src="./assets/gui/start-menu/pictures.png" alt="My Pictures">
                            <div class="item-content">
                                <span class="item-title">My Pictures</span>
                            </div>
                        </li>
                        <li class="menu-item" id="menu-recycle-bin">
                            <img src="./assets/gui/desktop/recycle-bin.png" alt="Recycle Bin">
                            <div class="item-content">
                                <span class="item-title">Recycle Bin</span>
                            </div>
                        </li>
                    </ul>
                    <div class="all-programs-container">
                        <li class="menu-divider"><hr class="divider"></li>
                        <div class="all-programs-button" id="menu-all-programs">
                            <span>All Programs</span>
                            <img src="./assets/gui/start-menu/arrow.ico" alt="All Programs">
                        </div>
                    </div>
                </div>
                <div class="middle-section middle-right">
                    <ul class="menu-items">
                        <li class="menu-item" id="menu-linkedin">
                            <img src="./assets/gui/start-menu/linkedin.png" alt="LinkedIn">
                            <div class="item-content">
                                <span class="item-title">LinkedIn</span>
                            </div>
                        </li>
                        <li class="menu-item" id="menu-github">
                            <img src="./assets/gui/start-menu/github.png" alt="GitHub">
                            <div class="item-content">
                                <span class="item-title">GitHub</span>
                            </div>
                        </li>
                        <li class="menu-item" id="menu-instagram">
                            <img src="./assets/gui/start-menu/instagram.png" alt="Instagram">
                            <div class="item-content">
                                <span class="item-title">Instagram</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="start-menu-footer">
                <div class="footer-buttons">
                    <div class="footer-button" id="btn-log-off">
                        <img src="./assets/gui/start-menu/logoff.png" alt="Log Off">
                        <span>Log Off</span>
                    </div>
                    <div class="footer-button" id="btn-shut-down">
                        <img src="./assets/gui/start-menu/shutdown.png" alt="Shut Down">
                        <span>Shut Down</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Set up all necessary event listeners
     */
    setupEventListeners() {
        document.addEventListener('mousedown', (e) => {
            if (this.startMenu?.classList.contains('active') && 
                !this.startMenu.contains(e.target) && 
                !this.startButton.contains(e.target) &&
                (!this.allProgramsMenu || !this.allProgramsMenu.contains(e.target))) {
                this.closeStartMenu();
            }
        }, true);
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.startMenu?.classList.contains('active')) {
                this.closeStartMenu();
            }
        });
        
        const handleIframeClick = () => {
            if (this.startMenu?.classList.contains('active')) {
                this.closeStartMenu();
            }
        };
        
        window.addEventListener('iframe:focus', handleIframeClick);
        
        window.addEventListener('message', (e) => {
            if (e.data?.type === 'iframe-clicked' || e.data?.type === 'window-focus') {
                if (this.startMenu?.classList.contains('active')) {
                    this.closeStartMenu();
                }
            }
        }, true);
    }
    
    /**
     * Set up menu items and their click handlers
     */
    setupMenuItems() {
        const menuItemHandlers = {
            'my-documents': () => { 
                console.log('Handler called for my-documents');
                this.openProgram('my-documents'); 
                this.closeStartMenu(); 
            },
            'my-computer': () => { this.openProgram('my-computer'); this.closeStartMenu(); },
            'messenger': () => { this.openProgram('messenger'); this.closeStartMenu(); },
            'my-pictures': () => { this.openProgram('my-pictures'); this.closeStartMenu(); },
            'email': () => { this.openProgram('email'); this.closeStartMenu(); },
            'recycle-bin': () => { this.openProgram('recycle-bin'); this.closeStartMenu(); },
            'cmd-prompt': () => { this.openProgram('cmd-prompt'); this.closeStartMenu(); }
        };
        
        Object.entries(menuItemHandlers).forEach(([id, handler]) => {
            const menuItem = this.startMenu.querySelector(`#menu-${id}`);
            if (menuItem) {
                menuItem.addEventListener('click', handler);
            }
        });
        
        const socialItems = {
            'instagram': 'https://www.instagram.com',
            'github': 'https://github.com',
            'linkedin': 'https://www.linkedin.com'
        };
        
        Object.entries(socialItems).forEach(([platform, url]) => {
            const menuItem = this.startMenu.querySelector(`#menu-${platform}`);
            if (menuItem) {
                menuItem.addEventListener('click', () => {
                    window.open(url, '_blank');
                    this.closeStartMenu();
                });
            }
        });

        const logOffButton = this.startMenu.querySelector('#btn-log-off');
        const shutDownButton = this.startMenu.querySelector('#btn-shut-down');
        
        if (logOffButton) {
            logOffButton.addEventListener('click', () => this.closeStartMenu());
        }
        
        if (shutDownButton) {
            shutDownButton.addEventListener('click', () => this.closeStartMenu());
        }

        setTimeout(() => this.setupAllProgramsMenu(), 100);
    }

    /**
     * Set up All Programs menu behavior
     */
    setupAllProgramsMenu() {
        const allProgramsButton = document.getElementById('menu-all-programs');
        
        if (!allProgramsButton || !this.allProgramsMenu || !this.startMenu) {
            return;
        }
        
        allProgramsButton.addEventListener('mouseenter', () => this.showAllProgramsMenu());
        this.allProgramsMenu.addEventListener('mouseleave', () => this.hideAllProgramsMenu());
        
        const otherElements = this.startMenu.querySelectorAll(
            '.menu-item:not(#menu-all-programs), .menutopbar, .start-menu-footer, .middle-right'
        );
        
        otherElements.forEach(element => {
            element.addEventListener('mouseenter', () => this.hideAllProgramsMenu());
        });
        
        const programItems = this.allProgramsMenu.querySelectorAll('.all-programs-item:not(.category)');
        programItems.forEach(item => {
            item.addEventListener('click', () => {
                const programName = item.textContent.trim().toLowerCase().replace(/\s+/g, '-');
                this.openProgram(programName);
                this.closeStartMenu();
            });
        });
    }

    /**
     * Show the All Programs menu
     */
    showAllProgramsMenu() {
        if (!this.allProgramsMenu || !this.startMenu) {
            return;
        }
        
        const allProgramsButton = this.startMenu.querySelector('#menu-all-programs');
        const footerElement = this.startMenu.querySelector('.start-menu-footer');
        
        if (!allProgramsButton || !footerElement) {
            return;
        }
        
        const buttonRect = allProgramsButton.getBoundingClientRect();
        const footerRect = footerElement.getBoundingClientRect();
        
        Object.assign(this.allProgramsMenu.style, {
            left: buttonRect.right + 'px',
            bottom: (window.innerHeight - footerRect.top) + 'px',
            top: 'auto',
            display: 'block'
        });
        
        this.allProgramsMenu.classList.add('active');
    }

    /**
     * Hide the All Programs menu
     */
    hideAllProgramsMenu() {
        if (this.allProgramsMenu) {
            this.allProgramsMenu.classList.remove('active');
            this.allProgramsMenu.style.display = 'none';
        }
    }
    
    /**
     * Open a program using the event bus
     */
    openProgram(programName) {
        this.eventBus.publish(EVENTS.PROGRAM_OPEN, { programName });
    }
    
    /**
     * Toggle the start menu visibility
     */
    toggleStartMenu() {
        if (!this.startMenu) {
            return;
        }
        
        const isCurrentlyActive = this.startMenu.classList.contains('active');
        
        if (!isCurrentlyActive) {
            this.startMenu.style.visibility = 'visible';
            this.startMenu.style.opacity = '1';
            this.startMenu.classList.add('active');
            this.eventBus.publish(EVENTS.STARTMENU_OPENED);
            this.positionAllProgramsMenu();
        } else {
            this.closeStartMenu();
        }
    }
    
    /**
     * Close the start menu
     */
    closeStartMenu(force = false) {
        console.log('closeStartMenu called. Is active?', this.startMenu.classList.contains('active'));
        if (!this.startMenu || (!this.startMenu.classList.contains('active') && !force)) {
            console.log('closeStartMenu returning early.');
            return;
        }
        
        this.startMenu.classList.remove('active');
        this.hideAllProgramsMenu();
        
        this.startMenu.style.visibility = 'hidden';
        this.startMenu.style.opacity = '0';
        console.log('closeStartMenu finished hiding.');
        
        this.eventBus.publish(EVENTS.STARTMENU_CLOSED);
    }

    positionAllProgramsMenu() {
        // Implementation of positionAllProgramsMenu method
    }
}
