/**
 * Clock module for Windows XP taskbar
 * Manages the system clock display and time updates
 */
import { EVENTS } from '../utils/constants.js';

export default class Clock {
    constructor(selector, eventBus) {
        this.eventBus = eventBus;
        this.clockElement = document.querySelector(selector);
        this.intervalId = null;
        this.initialTimeoutId = null;
        
        if (!this.clockElement) {
            console.error(`Clock element not found with selector: ${selector}`);
            return;
        }
        
        if (!this.eventBus) {
            console.error('EventBus not provided to Clock');
            return;
        }
        
        this.updateClock();
        this.setupClockUpdates();
        this.eventBusSubscription = this.eventBus.subscribe(EVENTS.CLOCK_UPDATE, () => this.updateClock());
    }
    
    setupClockUpdates() {
        requestAnimationFrame(() => {
            this.updateClock();
            
            const now = new Date();
            const delay = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
            
            this.initialTimeoutId = setTimeout(() => {
                this.intervalId = setInterval(() => this.updateClock(), 60000);
            }, delay);
        });
    }
    
    updateClock() {
        if (!this.clockElement) return;
        
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes < 10 ? '0' + minutes : minutes;
        
        const formattedTime = `${displayHours}:${displayMinutes} ${ampm}`;
        this.clockElement.textContent = formattedTime;
        
        this.eventBus?.publish(EVENTS.CLOCK_TIME_CHANGED, { formattedTime });
    }
    
    destroy() {
        if (this.initialTimeoutId) {
            clearTimeout(this.initialTimeoutId);
            this.initialTimeoutId = null;
        }
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        if (this.eventBus && this.eventBusSubscription) {
            this.eventBus.unsubscribe(this.eventBusSubscription);
            this.eventBusSubscription = null;
        }
    }
}
