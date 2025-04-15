import { setupIframeActivation } from '../../scripts/utils/iframeManager.js';
import { setupTooltips } from '../../scripts/utils/tooltip.js';

document.addEventListener('DOMContentLoaded', () => {
    // Enable communication with the parent window for focus management
    setupIframeActivation();

    // List of image sources for the photo viewer gallery
    const images = [
        'images/image1.jpg',
        'images/image2.jpg',
        'images/image3.jpg',
        'images/image4.jpg'
    ];

    // Get references to all UI elements used in the photo viewer
    const thumbnailStrip = document.querySelector('.thumbnail-strip');
    const mainImage = document.getElementById('main-image');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const rotateBtn = document.getElementById('rotate-btn');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const resetViewBtn = document.getElementById('reset-view-btn');
    const imageFilenameSpan = document.getElementById('image-filename');

    // State variables for the current image, rotation, zoom, and panning
    let currentImageIndex = 0;
    let currentRotation = 0;
    let currentZoom = 1;
    let isPanning = false;
    let panStartX, panStartY;
    let panStartTranslateX = 0, panStartTranslateY = 0;
    let currentTranslateX = 0, currentTranslateY = 0;

    // Set up tooltips for all control and navigation buttons
    setupTooltips('.controls button, .nav-button');

    // Display an error message if the main image fails to load
    function handleImageError() {
        mainImage.alt = "Error loading image.";
        mainImage.src = "";
    }

    // Assign the error handler to the main image
    mainImage.onerror = handleImageError;

    // Update the main image display, filename, and highlight the active thumbnail
    function updateMainImage() {
        if (images.length === 0) {
            mainImage.src = '';
            mainImage.alt = 'No pictures found';
            return;
        }
        mainImage.style.transition = 'none';
        resetTransformations();
        const currentSrc = images[currentImageIndex];
        mainImage.src = currentSrc;
        mainImage.alt = `Picture ${currentImageIndex + 1}`;
        const filename = currentSrc.substring(currentSrc.lastIndexOf('/') + 1);
        imageFilenameSpan.textContent = filename;
        imageFilenameSpan.title = filename;
        highlightActiveThumbnail();
        // Restore transition after updating the image
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                mainImage.style.transition = 'transform 0.2s ease';
            });
        });
    }

    // Reset all image transformations to their default state
    function resetTransformations() {
        currentRotation = 0;
        currentZoom = 1;
        currentTranslateX = 0;
        currentTranslateY = 0;
        applyTransform();
    }

    // Apply the current translation, zoom, and rotation to the main image
    function applyTransform() {
        mainImage.style.transform = 
            `translate(${currentTranslateX}px, ${currentTranslateY}px) scale(${currentZoom}) rotate(${currentRotation}deg)`;
    }

    // Highlight the currently active thumbnail and scroll it into view
    function highlightActiveThumbnail() {
        document.querySelectorAll('.thumbnail-item').forEach((item, index) => {
            item.classList.toggle('active', index === currentImageIndex);
            if (index === currentImageIndex) {
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        });
    }

    // Create a thumbnail element for a given image source and index
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

    // Populate the thumbnail strip with all image thumbnails
    function populateThumbnails() {
        thumbnailStrip.innerHTML = '';
        images.forEach((src, index) => {
            const thumbnail = createThumbnail(src, index);
            thumbnailStrip.appendChild(thumbnail);
        });
        highlightActiveThumbnail();
    }

    // Event listener for the Previous button to show the previous image
    prevBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        updateMainImage();
    });

    // Event listener for the Next button to show the next image
    nextBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex + 1) % images.length;
        updateMainImage();
    });

    // Event listener for the Rotate button to rotate the image by 90 degrees
    rotateBtn.addEventListener('click', () => {
        currentRotation += 90;
        applyTransform();
    });

    // Event listener for the Zoom In button to increase the image zoom
    zoomInBtn.addEventListener('click', () => {
        currentZoom = Math.min(currentZoom * 1.2, 5);
        applyTransform();
    });

    // Event listener for the Zoom Out button to decrease the image zoom
    zoomOutBtn.addEventListener('click', () => {
        currentZoom = Math.max(currentZoom / 1.2, 0.2);
        applyTransform();
    });

    // Event listener for the Reset View button to reset all transformations
    resetViewBtn.addEventListener('click', resetTransformations);

    // Enable panning of the image when zoomed in and the mouse is pressed
    mainImage.addEventListener('mousedown', (e) => {
        if (currentZoom <= 1) return;
        isPanning = true;
        panStartX = e.clientX;
        panStartY = e.clientY;
        panStartTranslateX = currentTranslateX;
        panStartTranslateY = currentTranslateY;
        mainImage.style.cursor = 'grabbing'; 
        mainImage.style.transition = 'none';
        e.preventDefault();
    });

    // Update the image position as the mouse moves during panning
    window.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        const dx = e.clientX - panStartX;
        const dy = e.clientY - panStartY;
        currentTranslateX = panStartTranslateX + dx;
        currentTranslateY = panStartTranslateY + dy;
        applyTransform();
    });

    // Stop panning and restore the cursor and transition when the mouse is released
    window.addEventListener('mouseup', () => {
        if (isPanning) {
            isPanning = false;
            mainImage.style.cursor = 'grab';
            mainImage.style.transition = 'transform 0.2s ease';
        }
    });
    // Stop panning if the mouse leaves the window
    window.addEventListener('mouseleave', () => {
        if (isPanning) {
            isPanning = false;
            mainImage.style.cursor = 'grab';
            mainImage.style.transition = 'transform 0.2s ease'; 
        }
    });

    // Initialize the photo viewer by populating thumbnails and displaying the first image
    if (images.length > 0) {
        populateThumbnails();
        updateMainImage();
    } else {
        thumbnailStrip.innerHTML = '<p style="padding: 5px; color: #666;">No pictures.</p>';
        updateMainImage(); 
    }
});