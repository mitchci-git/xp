/**
 * Taskbar module for managing the start menu and system tray
 */
import StartMenu from './startMenu.js';
import { EVENTS } from '../utils/constants.js';

export default class Taskbar {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.startButton = document.getElementById('start-button');
        this.startMenuComponent = new StartMenu(this.eventBus);
        this.taskbarProgramsContainer = document.querySelector('.taskbar-programs');
        this.systemTray = document.querySelector('.system-tray');
        
        this.setupStartButtonEffects();
        this.setupTooltips();
        this.subscribeToEvents();
        this.setupResponsiveTaskbar();
    }
    
    /**
     * Subscribe to event bus events
     */
    subscribeToEvents() {
        this.eventBus.subscribe(EVENTS.STARTMENU_OPENED, () => {
            this.startButton.classList.add('active');
        });
        
        this.eventBus.subscribe(EVENTS.STARTMENU_CLOSED, () => {
            this.startButton.classList.remove('active');
        });
        
        this.eventBus.subscribe(EVENTS.WINDOW_CREATED, () => {
            this.updateTaskbarLayout();
        });
        
        this.eventBus.subscribe(EVENTS.WINDOW_CLOSED, () => {
            this.updateTaskbarLayout();
        });
    }
    
    /**
     * Set up hover and click effects for start button
     */
    setupStartButtonEffects() {
        this.startButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.eventBus.publish(EVENTS.STARTMENU_TOGGLE);
        });
    }
    
    /**
     * Set up tooltips for system tray icons
     */
    setupTooltips() {
        const existingTooltips = document.querySelectorAll('.taskbar-tooltip');
        existingTooltips.forEach(tooltip => {
            tooltip.parentNode.removeChild(tooltip);
        });
        
        const trayIcons = document.querySelectorAll('.tray-status-icon, .tray-network-icon, .tray-volume-icon');
        let activeTooltip = null;
        
        trayIcons.forEach(icon => {
            icon.addEventListener('mouseenter', () => {
                const tooltipText = icon.getAttribute('data-tooltip');
                if (!tooltipText) return;
                
                if (activeTooltip?.parentNode) {
                    activeTooltip.parentNode.removeChild(activeTooltip);
                }
                
                const tooltip = document.createElement('div');
                tooltip.className = 'taskbar-tooltip';
                tooltip.textContent = tooltipText;
                
                const iconRect = icon.getBoundingClientRect();
                tooltip.style.bottom = (window.innerHeight - iconRect.top + 5) + 'px';
                
                document.body.appendChild(tooltip);
                tooltip.style.left = (iconRect.left + (iconRect.width / 2) - (tooltip.offsetWidth / 2)) + 'px';
                
                activeTooltip = tooltip;
            });
            
            icon.addEventListener('mouseleave', () => {
                if (activeTooltip?.parentNode) {
                    activeTooltip.parentNode.removeChild(activeTooltip);
                    activeTooltip = null;
                }
            });
        });
    }

    /**
     * Setup responsive taskbar that adjusts program item widths based on available space
     */
    setupResponsiveTaskbar() {
        this.updateTaskbarLayout();
        
        window.addEventListener('resize', () => {
            this.updateTaskbarLayout();
        });
        
        const observer = new MutationObserver(() => {
            this.updateTaskbarLayout();
        });
        
        observer.observe(this.taskbarProgramsContainer, {
            childList: true,
            subtree: false
        });
    }
    
    /**
     * Updates the taskbar layout, adjusting program item widths based on available space
     */
    updateTaskbarLayout() {
        const taskbarItems = document.querySelectorAll('.taskbar-item');
        if (taskbarItems.length === 0) return;
        
        const taskbarWidth = document.querySelector('.taskbar').offsetWidth;
        const startButtonWidth = this.startButton.offsetWidth;
        const quickLaunchWidth = document.querySelector('.quick-launch')?.offsetWidth || 0;
        const systemTrayWidth = this.systemTray.offsetWidth;
        
        // Calculate available width, subtracting container elements and some padding/margin buffer (25px)
        const availableWidth = taskbarWidth - startButtonWidth - quickLaunchWidth - systemTrayWidth - 25;
        
        const defaultWidth = 160;
        const minWidth = 100;
        
        let itemWidth = defaultWidth;
        
        if (taskbarItems.length * defaultWidth > availableWidth) {
            itemWidth = Math.max(minWidth, availableWidth / taskbarItems.length);
        }
        
        taskbarItems.forEach(item => {
            item.style.minWidth = `${itemWidth}px`;
            item.style.maxWidth = `${itemWidth}px`;
            item.style.width = `${itemWidth}px`;
        });
        
        // flex-shrink and flex-grow are handled by CSS
        // this.systemTray.style.flexShrink = '0';
        // this.systemTray.style.flexGrow = '0';
    }
}
