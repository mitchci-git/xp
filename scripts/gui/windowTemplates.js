/**
 * Window Templates module
 * Provides templates for different window types in the Windows XP simulation
 */
class WindowTemplates {
    /**
     * Gets a template container for windows
     * @param {string} [templateName] - Optional template type identifier
     * @param {object} [programConfig] - Optional program configuration object
     * @returns {HTMLElement} DOM element containing the window content
     */
    static getTemplate(templateName, programConfig) {
        let content;
        
        // Handle standard iframe apps via appPath
        if (templateName === 'iframe-standard' && programConfig?.appPath) {
             content = this.createIframeContainer(programConfig.appPath);
        }
        
        // Default fallback
        else {
            content = this.createEmptyContainer();
            content.innerHTML = `<p style="padding:10px;">Error: Template '${templateName}' not found or missing appPath.</p>`;
        }
        
        return content;
    }
    
    /**
     * Creates a standard window container with no content
     * @returns {HTMLElement} Empty window content container
     */
    static createEmptyContainer() {
        const content = document.createElement('div');
        content.className = 'window-body';
        return content;
    }
    
    /**
     * Creates a container with an iframe
     * @param {string} src - The source URL for the iframe
     * @returns {HTMLElement} Container with iframe
     */
    static createIframeContainer(src) {
        const content = document.createElement('div');
        content.className = 'window-body special-iframe-container';
        
        const iframe = document.createElement('iframe');
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowtransparency', 'true');
        iframe.setAttribute('src', src.startsWith('/') ? src : '/' + src);
        
        content.appendChild(iframe);
        return content;
    }
}

export default WindowTemplates;
