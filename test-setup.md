# Testing Video and Image Support

## Setup Instructions

1. **Create the content directory structure:**
   ```bash
   mkdir -p content/thumbnails
   ```

2. **Add some test files:**
   - Place some `.mp4` or `.mov` video files in the `content/` directory
   - Place some image files (`.jpg`, `.png`, `.gif`, etc.) in the `content/` directory

3. **Update the scripts with your actual paths:**
   Edit both `compress.sh` and `dirmonitor.sh` and replace:
   ```bash
   input_directory="<directory of content>"
   output_directory="<directory of thumbnails>"
   ```
   
   With your actual paths, for example:
   ```bash
   input_directory="/var/www/html/images/content"
   output_directory="/var/www/html/images/content/thumbnails"
   ```

4. **Test your setup (optional but recommended):**
   ```bash
   chmod +x test-thumbnails.sh
   ./test-thumbnails.sh
   ```

5. **Generate thumbnails:**
   ```bash
   chmod +x compress.sh
   ./compress.sh
   ```

6. **Start the directory monitor (optional):**
   ```bash
   chmod +x dirmonitor.sh
   sudo screen ./dirmonitor.sh
   ```

## What's New

### Enhanced Video Support Features:
- **MOV and MP4 files** are now fully supported with improved thumbnail generation
- **Video thumbnails** are automatically generated as JPG files (extracted from 1 second into the video, with fallback to first frame)
- **Play icon overlay** appears on video thumbnails
- **Video modal** opens when clicking on video thumbnails with full video player controls
- **Right-click** still opens the original video file in a new tab
- **ESC key support** to close video modal
- **Mobile responsive** video player

### New Image Focus Features:
- **Left-click on images** now opens them in a focused modal view
- **Image modal** with full-size display and zoom capabilities
- **Copy URL button** in image modal for easy sharing
- **Focus icon overlay** (🔍) appears on image thumbnails on hover
- **ESC key support** to close image modal
- **Mobile responsive** image modal

### File Processing Improvements:
- **Better error handling** for thumbnail generation
- **Fallback mechanism** for video thumbnails (tries 1 second, falls back to first frame)
- **Support for more image formats** (JPG, PNG, GIF, WebP, BMP)
- **Skip existing thumbnails** to avoid unnecessary processing
- **Verbose logging** to help troubleshoot issues
- **Hidden file filtering** (skips .files)

### User Experience:
- **Click on video thumbnail**: Opens video in modal player
- **Click on image thumbnail**: Opens image in focused modal view
- **Click on other file types**: Copies file URL to clipboard (legacy behavior)
- **Right-click on any media**: Opens original file in new tab
- **ESC or click outside modal**: Closes modal
- **Keyboard navigation** support
- **Mobile-optimized** interface

## Technical Details

The changes include:
1. **compress.sh & dirmonitor.sh**: Enhanced video/image detection, better error handling, and improved ffmpeg commands
2. **gallery.js**: Added image modal functionality, improved file type detection, and keyboard support
3. **style.css**: Added image modal styles, focus indicators, and enhanced mobile responsiveness
4. **test-thumbnails.sh**: New testing script to validate your setup

All existing functionality for images remains unchanged, with new focus modal as an enhancement.
