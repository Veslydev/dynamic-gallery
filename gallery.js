const gallery = document.getElementById('gallery');

// Function to check if a file is a video
function isVideoFile(filename) {
    const videoExtensions = ['.mp4', '.mov'];
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return videoExtensions.includes(extension);
}

// Function to get thumbnail filename for videos
function getThumbnailFilename(filename) {
    if (isVideoFile(filename)) {
        const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
        return nameWithoutExt + '.jpg';
    }
    return filename;
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
                        } else {
                            // Copy image URL to clipboard
                            navigator.clipboard.writeText(window.location.origin + '/images/content/' + fixed_url);
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