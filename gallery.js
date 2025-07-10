const gallery = document.getElementById('gallery');

// Function to check if a file is a video
function isVideoFile(filename) {
    const videoExtensions = ['.mp4', '.mov'];
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return videoExtensions.includes(extension);
}

// Function to check if a file is an image
function isImageFile(filename) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return imageExtensions.includes(extension);
}

// Function to get thumbnail filename for videos
function getThumbnailFilename(filename) {
    if (isVideoFile(filename)) {
        const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
        return nameWithoutExt + '.jpg';
    }
    return filename;
}

// Function to create image modal
function createImageModal() {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="image-modal-content">
            <span class="image-modal-close">&times;</span>
            <div class="nav-buttons left">
                <button class="nav-btn prev-btn">‹</button>
            </div>
            <div class="nav-buttons right">
                <button class="nav-btn next-btn">›</button>
            </div>
            <div class="zoom-controls">
                <button class="zoom-btn zoom-in-btn">+</button>
                <button class="zoom-btn zoom-out-btn">-</button>
                <button class="zoom-btn zoom-reset-btn">⌂</button>
            </div>
            <div class="image-container">
                <img src="" alt="Full size image">
            </div>
            <div class="image-info">
                <span class="image-filename"></span>
                <div class="modal-buttons">
                    <button class="copy-url-btn">Copy URL</button>
                    <button class="delete-file-btn">Delete File</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Modal state
    let currentIndex = 0;
    let mediaList = [];
    let zoomLevel = 1;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let translateX = 0;
    let translateY = 0;
    
    const img = modal.querySelector('img');
    const imageContainer = modal.querySelector('.image-container');
    const filenameSpan = modal.querySelector('.image-filename');
    const prevBtn = modal.querySelector('.prev-btn');
    const nextBtn = modal.querySelector('.next-btn');
    const zoomInBtn = modal.querySelector('.zoom-in-btn');
    const zoomOutBtn = modal.querySelector('.zoom-out-btn');
    const zoomResetBtn = modal.querySelector('.zoom-reset-btn');
    
    // Update navigation buttons state
    function updateNavButtons() {
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === mediaList.length - 1;
    }
    
    // Load media at specific index
    function loadMediaAtIndex(index) {
        if (index < 0 || index >= mediaList.length) return;
        
        currentIndex = index;
        const mediaInfo = mediaList[index];
        const fixed_url = mediaInfo.filename.split(' ').join('%20');
        
        img.src = 'content/' + fixed_url;
        filenameSpan.textContent = mediaInfo.filename;
        
        // Reset zoom
        resetZoom();
        updateNavButtons();
    }
    
    // Navigation functions
    function showPrevious() {
        if (currentIndex > 0) {
            loadMediaAtIndex(currentIndex - 1);
        }
    }
    
    function showNext() {
        if (currentIndex < mediaList.length - 1) {
            loadMediaAtIndex(currentIndex + 1);
        }
    }
    
    // Zoom functions
    function resetZoom() {
        zoomLevel = 1;
        translateX = 0;
        translateY = 0;
        updateImageTransform();
        imageContainer.classList.remove('zoomed');
        img.classList.remove('zoomed');
    }
    
    function updateImageTransform() {
        img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomLevel})`;
    }
    
    function zoomIn() {
        zoomLevel = Math.min(zoomLevel * 1.5, 5);
        updateImageTransform();
        if (zoomLevel > 1) {
            imageContainer.classList.add('zoomed');
            img.classList.add('zoomed');
        }
    }
    
    function zoomOut() {
        zoomLevel = Math.max(zoomLevel / 1.5, 0.5);
        updateImageTransform();
        if (zoomLevel <= 1) {
            imageContainer.classList.remove('zoomed');
            img.classList.remove('zoomed');
        }
    }
    
    function zoomToPoint(x, y, zoomDirection) {
        const rect = imageContainer.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const deltaX = x - centerX;
        const deltaY = y - centerY;
        
        const oldZoom = zoomLevel;
        if (zoomDirection > 0) {
            zoomLevel = Math.min(zoomLevel * 1.5, 5);
        } else {
            zoomLevel = Math.max(zoomLevel / 1.5, 0.5);
        }
        
        if (zoomLevel !== oldZoom) {
            const zoomRatio = zoomLevel / oldZoom;
            translateX = translateX * zoomRatio - deltaX * (zoomRatio - 1);
            translateY = translateY * zoomRatio - deltaY * (zoomRatio - 1);
            
            updateImageTransform();
            
            if (zoomLevel > 1) {
                imageContainer.classList.add('zoomed');
                img.classList.add('zoomed');
            } else {
                imageContainer.classList.remove('zoomed');
                img.classList.remove('zoomed');
            }
        }
    }
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.image-modal-close');
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        resetZoom();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            resetZoom();
        }
    });

    // Navigation event listeners
    prevBtn.addEventListener('click', showPrevious);
    nextBtn.addEventListener('click', showNext);
    
    // Zoom event listeners
    zoomInBtn.addEventListener('click', zoomIn);
    zoomOutBtn.addEventListener('click', zoomOut);
    zoomResetBtn.addEventListener('click', resetZoom);
    
    // Image click/drag functionality
    imageContainer.addEventListener('click', (e) => {
        if (isDragging) return;
        
        const rect = imageContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (zoomLevel <= 1) {
            // Zoom in to clicked point
            zoomToPoint(x, y, 1);
        }
    });
    
    imageContainer.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        resetZoom();
    });
    
    // Mouse drag functionality for panning when zoomed
    img.addEventListener('mousedown', (e) => {
        if (zoomLevel > 1) {
            e.preventDefault();
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
            img.style.cursor = 'grabbing';
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging && zoomLevel > 1) {
            const deltaX = e.clientX - lastX;
            const deltaY = e.clientY - lastY;
            
            translateX += deltaX;
            translateY += deltaY;
            
            updateImageTransform();
            
            lastX = e.clientX;
            lastY = e.clientY;
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            if (zoomLevel > 1) {
                img.style.cursor = 'move';
            }
        }
    });
    
    // Mouse wheel zoom
    imageContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = imageContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        zoomToPoint(x, y, e.deltaY > 0 ? -1 : 1);
    });
    
    // Touch support for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    let initialDistance = 0;
    let initialZoom = 1;
    
    imageContainer.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            initialDistance = Math.sqrt(dx * dx + dy * dy);
            initialZoom = zoomLevel;
        }
    });
    
    imageContainer.addEventListener('touchmove', (e) => {
        e.preventDefault();
        
        if (e.touches.length === 1 && zoomLevel > 1) {
            // Pan
            const deltaX = e.touches[0].clientX - touchStartX;
            const deltaY = e.touches[0].clientY - touchStartY;
            
            translateX += deltaX;
            translateY += deltaY;
            
            updateImageTransform();
            
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            // Pinch zoom
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (initialDistance > 0) {
                const scale = distance / initialDistance;
                zoomLevel = Math.max(0.5, Math.min(5, initialZoom * scale));
                updateImageTransform();
                
                if (zoomLevel > 1) {
                    imageContainer.classList.add('zoomed');
                    img.classList.add('zoomed');
                } else {
                    imageContainer.classList.remove('zoomed');
                    img.classList.remove('zoomed');
                }
            }
        }
    });

    // Copy URL functionality
    const copyBtn = modal.querySelector('.copy-url-btn');
    copyBtn.addEventListener('click', () => {
        const filename = filenameSpan.textContent;
        
        // Create the full URL for the original file (same as how images are loaded)
        const encodedFilename = filename.split(' ').join('%20');
        const fullUrl = window.location.origin + window.location.pathname.replace(/\/$/, '') + '/content/' + encodedFilename;
        
        navigator.clipboard.writeText(fullUrl).then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = 'Copy URL';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy URL:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = fullUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = 'Copy URL';
            }, 2000);
        });
    });

    // Delete file functionality
    const deleteBtn = modal.querySelector('.delete-file-btn');
    deleteBtn.addEventListener('click', () => {
        const filename = filenameSpan.textContent;
        
        // Create the delete command (using relative path that should work in most setups)
        const deleteCommand = `rm -rf "./content/${filename}"`;
        
        navigator.clipboard.writeText(deleteCommand).then(() => {
            deleteBtn.textContent = 'Command Copied!';
            setTimeout(() => {
                deleteBtn.textContent = 'Delete File';
            }, 3000);
        }).catch(err => {
            console.error('Failed to copy delete command:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = deleteCommand;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            deleteBtn.textContent = 'Command Copied!';
            setTimeout(() => {
                deleteBtn.textContent = 'Delete File';
            }, 3000);
        });
    });

    // Keyboard support
    const keydownHandler = (e) => {
        if (modal.style.display === 'flex') {
            switch(e.key) {
                case 'Escape':
                    modal.style.display = 'none';
                    resetZoom();
                    break;
                case 'ArrowLeft':
                case '4': // Numpad 4
                    e.preventDefault();
                    showPrevious();
                    break;
                case 'ArrowRight':
                case '6': // Numpad 6
                    e.preventDefault();
                    showNext();
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    zoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    zoomOut();
                    break;
                case '0':
                    e.preventDefault();
                    resetZoom();
                    break;
            }
        }
    };
    
    document.addEventListener('keydown', keydownHandler);
    
    // Store the handler for cleanup
    modal.keydownHandler = keydownHandler;
    
    // Public methods for the modal
    modal.showMedia = function(mediaArray, startIndex = 0) {
        mediaList = mediaArray.filter(m => isImageFile(m.filename));
        currentIndex = Math.max(0, Math.min(startIndex, mediaList.length - 1));
        loadMediaAtIndex(currentIndex);
        modal.style.display = 'flex';
        updateNavButtons();
    };
    
    return modal;
}

// Function to create video modal
function createVideoModal() {
    const modal = document.createElement('div');
    modal.className = 'video-modal';
    modal.innerHTML = `
        <div class="video-modal-content">
            <span class="video-modal-close">&times;</span>
            <div class="nav-buttons left">
                <button class="nav-btn prev-btn">‹</button>
            </div>
            <div class="nav-buttons right">
                <button class="nav-btn next-btn">›</button>
            </div>
            <video controls autoplay>
                <source src="" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Modal state
    let currentIndex = 0;
    let mediaList = [];
    
    const video = modal.querySelector('video');
    const source = video.querySelector('source');
    const prevBtn = modal.querySelector('.prev-btn');
    const nextBtn = modal.querySelector('.next-btn');
    
    // Update navigation buttons state
    function updateNavButtons() {
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === mediaList.length - 1;
    }
    
    // Load media at specific index
    function loadMediaAtIndex(index) {
        if (index < 0 || index >= mediaList.length) return;
        
        currentIndex = index;
        const mediaInfo = mediaList[index];
        const fixed_url = mediaInfo.filename.split(' ').join('%20');
        
        source.src = 'content/' + fixed_url;
        video.load();
        updateNavButtons();
    }
    
    // Navigation functions
    function showPrevious() {
        if (currentIndex > 0) {
            loadMediaAtIndex(currentIndex - 1);
        }
    }
    
    function showNext() {
        if (currentIndex < mediaList.length - 1) {
            loadMediaAtIndex(currentIndex + 1);
        }
    }
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.video-modal-close');
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        video.pause();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            video.pause();
        }
    });

    // Navigation event listeners
    prevBtn.addEventListener('click', showPrevious);
    nextBtn.addEventListener('click', showNext);

    // Keyboard support
    const keydownHandler = (e) => {
        if (modal.style.display === 'flex') {
            switch(e.key) {
                case 'Escape':
                    modal.style.display = 'none';
                    video.pause();
                    break;
                case 'ArrowLeft':
                case '4': // Numpad 4
                    e.preventDefault();
                    showPrevious();
                    break;
                case 'ArrowRight':
                case '6': // Numpad 6
                    e.preventDefault();
                    showNext();
                    break;
                case ' ':
                    e.preventDefault();
                    if (video.paused) {
                        video.play();
                    } else {
                        video.pause();
                    }
                    break;
            }
        }
    };
    
    document.addEventListener('keydown', keydownHandler);
    
    // Store the handler for cleanup
    modal.keydownHandler = keydownHandler;
    
    // Public methods for the modal
    modal.showMedia = function(mediaArray, startIndex = 0) {
        mediaList = mediaArray.filter(m => isVideoFile(m.filename));
        currentIndex = Math.max(0, Math.min(startIndex, mediaList.length - 1));
        loadMediaAtIndex(currentIndex);
        modal.style.display = 'flex';
        updateNavButtons();
    };

    return modal;
}

// Pagination configuration
const ITEMS_PER_PAGE = 50;
let currentPage = 0;
let allMediaInfo = [];
let isLoading = false;
let hasMoreItems = true;

// Create loading indicator
function createLoadingIndicator() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-indicator';
    loadingDiv.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading more images...</div>
    `;
    loadingDiv.style.display = 'none';
    return loadingDiv;
}

// Function to create media item element
function createMediaItemElement(mediaInfo, videoModal, imageModal) {
    const container = document.createElement('div');
    container.className = 'media-item';
    
    const img = document.createElement('img');
    const thumbnailFilename = getThumbnailFilename(mediaInfo.filename);
    const thumbnailUrl = 'content/thumbnails/' + thumbnailFilename;
    img.src = img.alt = thumbnailUrl;
    
    // Add play icon overlay for videos
    if (isVideoFile(mediaInfo.filename)) {
        container.classList.add('video-item');
        const playIcon = document.createElement('div');
        playIcon.className = 'play-icon';
        playIcon.innerHTML = '▶';
        container.appendChild(playIcon);
    } else if (isImageFile(mediaInfo.filename)) {
        container.classList.add('image-item');
        // Add a subtle focus indicator for images
        const focusIcon = document.createElement('div');
        focusIcon.className = 'focus-icon';
        focusIcon.innerHTML = '🔍';
        container.appendChild(focusIcon);
    }
    
    container.appendChild(img);

    container.addEventListener('click', () => {
        if (isVideoFile(mediaInfo.filename)) {
            // Find index in video array and open video modal
            const videoIndex = allMediaInfo.filter(m => isVideoFile(m.filename))
                .findIndex(m => m.filename === mediaInfo.filename);
            videoModal.showMedia(allMediaInfo, videoIndex);
        } else if (isImageFile(mediaInfo.filename)) {
            // Find index in image array and open image modal
            const imageIndex = allMediaInfo.filter(m => isImageFile(m.filename))
                .findIndex(m => m.filename === mediaInfo.filename);
            imageModal.showMedia(allMediaInfo, imageIndex);
        } else {
            // For other file types, copy URL to clipboard
            const fixed_url = mediaInfo.filename.split(' ').join('%20');
            const currentUrl = window.location.origin + window.location.pathname.replace(/\/$/, '') + '/content/' + fixed_url;
            navigator.clipboard.writeText(currentUrl);
        }
    });

    container.addEventListener('contextmenu', (menu) => {
        menu.preventDefault();
        const link = document.createElement('a');
        link.href = 'content/' + mediaInfo.filename;
        link.target = '_blank';
        link.click();
    });

    return container;
}

// Function to load a page of media items
function loadMediaPage(videoModal, imageModal, loadingIndicator) {
    if (isLoading || !hasMoreItems) return;
    
    isLoading = true;
    loadingIndicator.style.display = 'flex';
    
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, allMediaInfo.length);
    const pageItems = allMediaInfo.slice(startIndex, endIndex);
    
    // Simulate a small delay to show loading indicator
    setTimeout(() => {
        pageItems.forEach(mediaInfo => {
            const mediaElement = createMediaItemElement(mediaInfo, videoModal, imageModal);
            gallery.appendChild(mediaElement);
        });
        
        currentPage++;
        hasMoreItems = endIndex < allMediaInfo.length;
        
        isLoading = false;
        loadingIndicator.style.display = 'none';
        
        // Show "no more items" message if all items are loaded
        if (!hasMoreItems) {
            showEndMessage();
        }
    }, 300);
}

// Function to show end of gallery message
function showEndMessage() {
    const endMessage = document.createElement('div');
    endMessage.className = 'end-message';
    endMessage.innerHTML = `
        <div class="end-text">🎉 You've reached the end! Total items: ${allMediaInfo.length}</div>
    `;
    gallery.appendChild(endMessage);
}

// Function to check if user has scrolled near the bottom
function checkScrollPosition() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // Load more items when user is within 200px of the bottom
    if (scrollTop + windowHeight >= documentHeight - 200) {
        loadMediaPage(window.videoModal, window.imageModal, window.loadingIndicator);
    }
}

// Throttled scroll event handler
let scrollTimeout;
function handleScroll() {
    if (scrollTimeout) return;
    
    scrollTimeout = setTimeout(() => {
        checkScrollPosition();
        scrollTimeout = null;
    }, 100);
}

fetch('content/')
    .then(response => response.text())
    .then(data => {
        const parser = new DOMParser();
        const htmlDocument = parser.parseFromString(data, 'text/html');
        const links = Array.from(htmlDocument.querySelectorAll('a'));

        const mediaFilenames = links
            .map(link => link.textContent.trim())
            // hide directories and the nginx fancyindex page.
            .filter(filename => !filename.includes('/') && !filename.includes('↓') &&
                !filename.includes('File') && !filename.includes('Date'));

        const fetchLastModifiedPromises = mediaFilenames.map(async filename => {
            const response = await fetch('content/' + filename, { method: 'HEAD' });
            return ({
                filename: filename,
                lastModified: new Date(response.headers.get('last-modified'))
            });
        });

        Promise.all(fetchLastModifiedPromises)
            .then(mediaInfoArray => {
                allMediaInfo = mediaInfoArray
                    .filter(mediaInfo => mediaInfo.lastModified !== null)
                    .sort((a, b) => b.lastModified - a.lastModified);

                // Create modals and loading indicator
                window.videoModal = createVideoModal();
                window.imageModal = createImageModal();
                window.loadingIndicator = createLoadingIndicator();
                
                // Add loading indicator to the page
                document.body.appendChild(window.loadingIndicator);
                
                // Load first page
                loadMediaPage(window.videoModal, window.imageModal, window.loadingIndicator);
                
                // Add scroll event listener for pagination
                window.addEventListener('scroll', handleScroll);
            });
    });