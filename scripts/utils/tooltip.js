/**
 * Reusable tooltip utility that provides consistent tooltip behavior across the application.
 */

/**
 * Sets up hover tooltips for elements matching a specified selector.
 * 
 * @param {string} selector CSS selector for elements that should have tooltips.
 * @param {HTMLElement} [tooltipContainer=document.body] Container where the tooltip will be appended.
 * @param {number} [delay=100] Delay in ms before hiding the tooltip after mouseleave.
 */
export function setupTooltips(selector, tooltipContainer = document.body, delay = 100) {
    let activeTooltip = null;
    let tooltipTimeout = null;

    // Get or create the tooltip element
    const tooltipElement = tooltipContainer.querySelector('.dynamic-tooltip') || (() => {
        const el = document.createElement('div');
        el.className = 'dynamic-tooltip';
        Object.assign(el.style, {
            position: 'absolute', display: 'none', zIndex: '10000',
            backgroundColor: '#FFFFE1', border: '1px solid #000000',
            padding: '2px 5px', fontSize: '8pt', whiteSpace: 'nowrap',
            fontFamily: 'Tahoma, sans-serif', pointerEvents: 'none',
            boxShadow: '1px 1px 3px rgba(0,0,0,0.2)'
        });
        tooltipContainer.appendChild(el);
        return el;
    })();

    // Tooltip state management functions
    const hideImmediately = () => {
        clearTimeout(tooltipTimeout);
        if (!activeTooltip) return;
        
        activeTooltip.style.display = 'none';
        activeTooltip = null;
    };

    const hideTooltip = () => {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = setTimeout(hideImmediately, delay);
    };

    const showTooltip = element => {
        const tooltipText = element.getAttribute('data-tooltip') || element.getAttribute('title');
        if (!tooltipText) return;

        clearTimeout(tooltipTimeout);
        tooltipElement.textContent = tooltipText;
        tooltipElement.style.display = 'block';
        activeTooltip = tooltipElement;

        // Calculate optimal position
        const containerRect = tooltipContainer === document.body ? 
            { top: 0, left: 0 } : tooltipContainer.getBoundingClientRect();
        
        const { top, left } = _calculateTooltipPosition(element, tooltipElement, containerRect);

        Object.assign(tooltipElement.style, { top: `${top}px`, left: `${left}px` });
    };

    // Attach event listeners to matching elements
    document.querySelectorAll(selector).forEach(element => {
        element.addEventListener('mouseenter', () => showTooltip(element));
        element.addEventListener('mouseleave', hideTooltip);
        element.addEventListener('click', hideImmediately);
    });
}

// Extracted tooltip positioning logic into a helper function
function _calculateTooltipPosition(element, tooltipElement, containerRect) {
    const targetRect = element.getBoundingClientRect();

    // Calculate top and left positions for the tooltip
    let top = targetRect.bottom - containerRect.top + 5;
    let left = targetRect.left - containerRect.left + (targetRect.width / 2) - (tooltipElement.offsetWidth / 2);

    // Adjust position if tooltip overflows the window height
    if (top + tooltipElement.offsetHeight > window.innerHeight) {
        top = targetRect.top - containerRect.top - tooltipElement.offsetHeight - 5;
    }

    // Adjust position if tooltip overflows the window width
    if (left + tooltipElement.offsetWidth > window.innerWidth) {
        left = window.innerWidth - tooltipElement.offsetWidth - 5;
    }

    // Ensure tooltip does not go beyond the left edge of the window
    if (left < 0) left = 5;

    return { top, left };
}
