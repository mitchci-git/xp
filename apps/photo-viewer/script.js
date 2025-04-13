import { setupIframeActivation } from '../../scripts/utils/iframeManager.js';
import { setupTooltips } from '../../scripts/utils/tooltip.js';

document.addEventListener('DOMContentLoaded', () => {
    // Try to activate parent communication (for focus handling)
    setupIframeActivation();

    const images = [
        // Updated to use .jpg extension as per user
        'images/image1.jpg',
        'images/image2.jpg',
        'images/image3.jpg',
        'images/image4.jpg'
        // Add more .jpg images if needed
    ];

    const thumbnailStrip = document.querySelector('.thumbnail-strip');
    const mainImage = document.getElementById('main-image');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const rotateBtn = document.getElementById('rotate-btn');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const resetViewBtn = document.getElementById('reset-view-btn');
    const imageFilenameSpan = document.getElementById('image-filename');

    let currentImageIndex = 0;
    let currentRotation = 0;
    let currentZoom = 1;
    let isPanning = false;
    let panStartX, panStartY;
    let panStartTranslateX = 0, panStartTranslateY = 0;
    let currentTranslateX = 0, currentTranslateY = 0;

    // Call the new utility function for controls and nav buttons
    setupTooltips('.controls button, .nav-button');

    // --- Error Handling ---
    function handleImageError() {
        mainImage.alt = "Error loading image.";
        // Optionally, set to a placeholder or clear src completely
        
        mainImage.src = ""; // Clear src to show alt text more reliably
    }

    // Attach the error handler
    mainImage.onerror = handleImageError;

    // --- Core Functions ---
    function updateMainImage() {
        if (images.length === 0) {
            mainImage.src = ''; // Handle empty case
            mainImage.alt = 'No pictures found';
            return;
        }

        // Temporarily disable transition to prevent animation on reset
        mainImage.style.transition = 'none';

        // Reset transformations BEFORE changing the source
        resetTransformations(); 

        const currentSrc = images[currentImageIndex];
        mainImage.src = currentSrc;
        mainImage.alt = `Picture ${currentImageIndex + 1}`;
        
        // Update filename display
        const filename = currentSrc.substring(currentSrc.lastIndexOf('/') + 1);
        imageFilenameSpan.textContent = filename;
        imageFilenameSpan.title = filename;
        
        highlightActiveThumbnail();

        // Re-enable transition shortly after applying changes
        requestAnimationFrame(() => {
            requestAnimationFrame(() => { // Double RAF ensures styles are applied
                mainImage.style.transition = 'transform 0.2s ease';
            });
        });
    }

    function resetTransformations() {
        currentRotation = 0;
        currentZoom = 1;
        currentTranslateX = 0;
        currentTranslateY = 0;
        applyTransform();
    }

    // Added comments to explain image transformation logic
    function applyTransform() {
        mainImage.style.transform = 
            `translate(${currentTranslateX}px, ${currentTranslateY}px) scale(${currentZoom}) rotate(${currentRotation}deg)`;
    }

    function highlightActiveThumbnail() {
        document.querySelectorAll('.thumbnail-item').forEach((item, index) => {
            item.classList.toggle('active', index === currentImageIndex);
            if (index === currentImageIndex) {
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        });
    }

    // Simplified repeated logic for thumbnail creation
    function createThumbnail(src, index) {
        const item = document.createElement('div');
        item.className = 'thumbnail-item';
        item.dataset.index = index;

        const img = document.createElement('img');
        img.src = src;
        img.alt = `Thumbnail ${index + 1}`;
        img.loading = 'lazy';

        const filename = src.substring(src.lastIndexOf('/') + 1);
        const nameSpan = document.createElement('span');
        nameSpan.textContent = filename;

        item.appendChild(img);
        item.appendChild(nameSpan);

        item.addEventListener('click', () => {
            currentImageIndex = index;
            updateMainImage();
        });

        return item;
    }

    // Updated populateThumbnails to use the helper function
    function populateThumbnails() {
        thumbnailStrip.innerHTML = '';
        images.forEach((src, index) => {
            const thumbnail = createThumbnail(src, index);
            thumbnailStrip.appendChild(thumbnail);
        });
        highlightActiveThumbnail();
    }

    // --- Event Listeners --- 

    prevBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        updateMainImage();
    });

    nextBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex + 1) % images.length;
        updateMainImage();
    });

    rotateBtn.addEventListener('click', () => {
        currentRotation += 90;
        applyTransform();
    });

    zoomInBtn.addEventListener('click', () => {
        currentZoom = Math.min(currentZoom * 1.2, 5); // Max zoom 5x
        applyTransform();
    });

    zoomOutBtn.addEventListener('click', () => {
        currentZoom = Math.max(currentZoom / 1.2, 0.2); // Min zoom 0.2x
        applyTransform();
    });

    // New listener for Reset View button
    resetViewBtn.addEventListener('click', resetTransformations);

    // Panning Logic
    mainImage.addEventListener('mousedown', (e) => {
        if (currentZoom <= 1) return; // Only allow panning when zoomed in
        isPanning = true;
        panStartX = e.clientX;
        panStartY = e.clientY;
        panStartTranslateX = currentTranslateX;
        panStartTranslateY = currentTranslateY;
        mainImage.style.cursor = 'grabbing'; 
        mainImage.style.transition = 'none'; // Disable transition during pan
        e.preventDefault(); // Prevent default image drag behavior
    });

    window.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        const dx = e.clientX - panStartX;
        const dy = e.clientY - panStartY;
        currentTranslateX = panStartTranslateX + dx;
        currentTranslateY = panStartTranslateY + dy;
        applyTransform();
    });

    window.addEventListener('mouseup', () => {
        if (isPanning) {
            isPanning = false;
            mainImage.style.cursor = 'grab';
            mainImage.style.transition = 'transform 0.2s ease'; // Re-enable transition
        }
    });
     window.addEventListener('mouseleave', () => { // Stop panning if mouse leaves window
        if (isPanning) {
            isPanning = false;
            mainImage.style.cursor = 'grab';
             mainImage.style.transition = 'transform 0.2s ease'; 
        }
    });

    // --- Initialization ---
    if (images.length > 0) {
        populateThumbnails();
        updateMainImage();
    } else {
        thumbnailStrip.innerHTML = '<p style="padding: 5px; color: #666;">No pictures.</p>';
        updateMainImage(); 
    }
});