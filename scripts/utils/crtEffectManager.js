/**
 * Manages CRT visual effects for the Windows XP simulation
 */
import { EVENTS } from '../utils/constants.js';

export default class CrtEffectManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.crtEnabled = true;
        this.scanlineOpacity = 0.2;
        this.flickerIntensity = 0.1;
        this.vignetteOpacity = 0.3;
        
        this.crtElements = this.getCrtElements();
        this.initializeEffects();
        this.subscribeToEvents();
    }
    
    getCrtElements() {
        return {
            base: document.querySelector('.crt'),
            glow: document.querySelector('.crt-glow'),
            vignette: document.querySelector('.crt-vignette'),
            noise: document.querySelector('.crt-noise'),
            scanline: document.querySelector('.crt-scanline'),
            aberration: document.querySelector('.crt-aberration'),
            flicker: document.querySelector('.crt-flicker')
        };
    }
    
    initializeEffects() {
        if (this.isMobileDevice()) {
            this.disableCrtEffects();
        } else {
            this.loadSettings();
        }
        
        this.updateCrtEffects();
    }
    
    subscribeToEvents() {
        if (!this.eventBus) {
            console.error('EventBus not provided to CrtEffectManager');
            return;
        }
        
        this.eventBus.subscribe(EVENTS.CRT_TOGGLE, () => this.toggleCrtEffects());
        this.eventBus.subscribe(EVENTS.CRT_UPDATE_SETTINGS, settings => this.updateSettings(settings));
        
        this.boundHandleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.boundHandleResize);
    }
    
    handleResize() {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        this.resizeTimeout = setTimeout(() => {
            if (this.isMobileDevice()) {
                this.disableCrtEffects();
            } else if (this.crtEnabled) {
                this.updateCrtEffects();
            }
        }, 200);
    }
    
    isMobileDevice() {
        return window.innerWidth <= 768 || ('ontouchstart' in window);
    }
    
    toggleCrtEffects() {
        this.crtEnabled = !this.crtEnabled;
        this.updateCrtEffects();
        this.saveSettings();
    }
    
    disableCrtEffects() {
        this.crtEnabled = false;
        this.updateCrtEffects();
    }
    
    updateCrtEffects() {
        const displayValue = this.crtEnabled ? 'block' : 'none';
        
        Object.values(this.crtElements).forEach(element => {
            if (element) {
                element.style.display = displayValue;
            }
        });
        
        document.body.classList.toggle('crt-disabled', !this.crtEnabled);
    }
    
    updateSettings(settings) {
        const root = document.documentElement;
        
        if (settings.scanlineOpacity !== undefined) {
            root.style.setProperty('--crt-scanline-opacity', settings.scanlineOpacity);
            this.scanlineOpacity = settings.scanlineOpacity;
        }
        
        if (settings.flickerIntensity !== undefined) {
            root.style.setProperty('--crt-flicker-opacity', settings.flickerIntensity);
            this.flickerIntensity = settings.flickerIntensity;
        }
        
        if (settings.vignetteOpacity !== undefined) {
            root.style.setProperty('--crt-vignette-opacity', settings.vignetteOpacity);
            this.vignetteOpacity = settings.vignetteOpacity;
        }
        
        this.saveSettings();
    }
    
    saveSettings() {
        try {
            const settings = {
                enabled: this.crtEnabled,
                scanlineOpacity: this.scanlineOpacity,
                flickerIntensity: this.flickerIntensity,
                vignetteOpacity: this.vignetteOpacity
            };
            
            localStorage.setItem('crt-settings', JSON.stringify(settings));
        } catch (e) {
            console.warn('Could not save CRT settings to localStorage');
        }
    }
    
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('crt-settings');
            
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                const root = document.documentElement;
                
                this.crtEnabled = settings.enabled !== undefined ? settings.enabled : true;
                
                if (settings.scanlineOpacity !== undefined) {
                    this.scanlineOpacity = settings.scanlineOpacity;
                    root.style.setProperty('--crt-scanline-opacity', settings.scanlineOpacity);
                }
                
                if (settings.flickerIntensity !== undefined) {
                    this.flickerIntensity = settings.flickerIntensity;
                    root.style.setProperty('--crt-flicker-opacity', settings.flickerIntensity);
                }
                
                if (settings.vignetteOpacity !== undefined) {
                    this.vignetteOpacity = settings.vignetteOpacity;
                    root.style.setProperty('--crt-vignette-opacity', settings.vignetteOpacity);
                }
            } else {
                const savedEnabled = localStorage.getItem('crt-enabled');
                if (savedEnabled !== null) {
                    this.crtEnabled = savedEnabled === 'true';
                }
            }
        } catch (e) {
            console.warn('Could not load CRT settings from localStorage');
        }
    }
    
    cleanup() {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
        
        if (this.boundHandleResize) {
            window.removeEventListener('resize', this.boundHandleResize);
            this.boundHandleResize = null;
        }
    }
}
