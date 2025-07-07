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
            <img src="" alt="Full size image">
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
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.image-modal-close');
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Copy URL functionality
    const copyBtn = modal.querySelector('.copy-url-btn');
    copyBtn.addEventListener('click', () => {
        const filenameSpan = modal.querySelector('.image-filename');
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
        const filenameSpan = modal.querySelector('.image-filename');
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
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            modal.style.display = 'none';
        }
    });
    
    return modal;
}

// Function to create video modal
function createVideoModal() {
    const modal = document.createElement('div');
    modal.className = 'video-modal';
    modal.innerHTML = `
        <div class="video-modal-content">
            <span class="video-modal-close">&times;</span>
            <video controls autoplay>
                <source src="" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.video-modal-close');
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        modal.querySelector('video').pause();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            modal.querySelector('video').pause();
        }
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            modal.style.display = 'none';
            modal.querySelector('video').pause();
        }
    });
    
    return modal;
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
                const sortedMediaInfo = mediaInfoArray
                    .filter(mediaInfo => mediaInfo.lastModified !== null)
                    .sort((a, b) => b.lastModified - a.lastModified);

                const videoModal = createVideoModal();
                const imageModal = createImageModal();

                sortedMediaInfo.forEach(mediaInfo => {
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
                        const fixed_url = mediaInfo.filename.split(' ').join('%20');
                        
                        if (isVideoFile(mediaInfo.filename)) {
                            // Open video in modal
                            const video = videoModal.querySelector('video');
                            const source = video.querySelector('source');
                            source.src = 'content/' + fixed_url;
                            video.load();
                            videoModal.style.display = 'flex';
                        } else if (isImageFile(mediaInfo.filename)) {
                            // Open image in modal
                            const modalImg = imageModal.querySelector('img');
                            const filenameSpan = imageModal.querySelector('.image-filename');
                            modalImg.src = 'content/' + fixed_url;
                            filenameSpan.textContent = mediaInfo.filename;
                            imageModal.style.display = 'flex';
                        } else {
                            // For other file types, copy URL to clipboard
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

                    gallery.appendChild(container);
                });
            });
    });