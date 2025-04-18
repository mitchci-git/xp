/**
 * Provides a utility for displaying tooltips on elements that match a selector.
 * Tooltips appear on hover and are positioned relative to the element.
 */

/**
 * Set up tooltips for all elements matching the selector. Tooltips are shown on hover and hidden on mouse leave or click.
 *
 * @param {string} selector - CSS selector for elements that should have tooltips.
 * @param {HTMLElement} [tooltipContainer=document.body] - The container where the tooltip will be appended.
 * @param {number} [delay=100] - Delay in milliseconds before hiding the tooltip after mouseleave.
 */
export function setupTooltips(selector, tooltipContainer = document.body, delay = 100) {
    let activeTooltip = null;
    let tooltipTimeout = null;

    // Create or reuse a tooltip element for displaying tooltip text
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

    // Hide the tooltip immediately and clear any pending timeouts
    const hideImmediately = () => {
        clearTimeout(tooltipTimeout);
        if (!activeTooltip) return;
        activeTooltip.style.display = 'none';
        activeTooltip = null;
    };

    // Hide the tooltip after a delay
    const hideTooltip = () => {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = setTimeout(hideImmediately, delay);
    };

    // Show the tooltip for a given element and position it appropriately
    const showTooltip = element => {
        const tooltipText = element.getAttribute('data-tooltip') || element.getAttribute('title');
        if (!tooltipText) return;
        clearTimeout(tooltipTimeout);
        tooltipElement.textContent = tooltipText;
        tooltipElement.style.display = 'block';
        activeTooltip = tooltipElement;
        const containerRect = tooltipContainer === document.body ? 
            { top: 0, left: 0 } : tooltipContainer.getBoundingClientRect();
        const { top, left } = _calculateTooltipPosition(element, tooltipElement, containerRect);
        Object.assign(tooltipElement.style, { top: `${top}px`, left: `${left}px` });
    };

    // Attach mouse event listeners to all elements matching the selector
    document.querySelectorAll(selector).forEach(element => {
        element.addEventListener('mouseenter', () => showTooltip(element));
        element.addEventListener('mouseleave', hideTooltip);
        element.addEventListener('click', hideImmediately);
    });
}

/**
 * Calculate the top and left position for the tooltip so it appears below the element and stays within the viewport.
 *
 * @param {HTMLElement} element - The element the tooltip is for.
 * @param {HTMLElement} tooltipElement - The tooltip element.
 * @param {DOMRect|Object} containerRect - The bounding rect of the tooltip container.
 * @returns {{top: number, left: number}} The calculated top and left position for the tooltip.
 */
function _calculateTooltipPosition(element, tooltipElement, containerRect) {
    const targetRect = element.getBoundingClientRect();
    let top = targetRect.bottom - containerRect.top + 5;
    let left = targetRect.left - containerRect.left + (targetRect.width / 2) - (tooltipElement.offsetWidth / 2);
    // If the tooltip would overflow the bottom of the window, show it above the element
    if (top + tooltipElement.offsetHeight > window.innerHeight) {
        top = targetRect.top - containerRect.top - tooltipElement.offsetHeight - 5;
    }
    // If the tooltip would overflow the right edge, shift it left
    if (left + tooltipElement.offsetWidth > window.innerWidth) {
        left = window.innerWidth - tooltipElement.offsetWidth - 5;
    }
    // Ensure the tooltip does not go beyond the left edge
    if (left < 0) left = 5;
    return { top, left };
}
