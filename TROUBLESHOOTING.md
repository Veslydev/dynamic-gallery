# Dynamic Gallery - Shell Compatibility & Troubleshooting Guide

## Quick Fix Summary

**The Problem:** Your gallery frontend is broken because the `dirmonitor.sh` script on your server is failing due to shell compatibility issues. The script contains bash-specific syntax (`[[`) but is being run in a POSIX shell environment.

## Immediate Action Required

### 1. **Stop the current failing dirmonitor process:**
```bash
# Find and kill the failing dirmonitor process
pkill -f dirmonitor
# or if running in screen:
screen -list
screen -S <session_name> -X quit
```

### 2. **Upload the fixed scripts to your server:**

You now have **4 different script versions** to choose from:

#### Option A: **POSIX-only scripts (Recommended for containers)**
- `compress-posix.sh` - Works in ANY shell environment
- `dirmonitor-posix.sh` - Works in ANY shell environment

#### Option B: **Bash-preferred scripts (Works in both bash and POSIX)**
- `compress.sh` - Updated with better compatibility
- `dirmonitor.sh` - Updated with better compatibility

### 3. **Upload and replace the server scripts:**

```bash
# On your server, backup current scripts
cp /home/container/www/compress.sh /home/container/www/compress.sh.backup
cp /home/container/www/dirmonitor.sh /home/container/www/dirmonitor.sh.backup

# Upload the POSIX-compatible versions (choose one approach):

# Option A: Use the POSIX-only versions
cp compress-posix.sh /home/container/www/compress.sh
cp dirmonitor-posix.sh /home/container/www/dirmonitor.sh

# OR Option B: Use the updated bash/POSIX hybrid versions
cp compress.sh /home/container/www/compress.sh
cp dirmonitor.sh /home/container/www/dirmonitor.sh

# Make them executable
chmod +x /home/container/www/compress.sh
chmod +x /home/container/www/dirmonitor.sh
```

### 4. **Test the fixed scripts:**

```bash
# Test compression script
cd /home/container/www
./compress.sh

# If successful, start the monitor
nohup ./dirmonitor.sh > dirmonitor.log 2>&1 &
# or use screen:
screen -S gallery-monitor ./dirmonitor.sh
```

## Detailed Problem Analysis

### Root Causes:
1. **Shell Environment Mismatch**: Container forced scripts to run with `/bin/sh` instead of `/bin/bash`
2. **Bash-specific Syntax**: Old scripts used `[[ ]]` which doesn't exist in POSIX shell
3. **Version Mismatch**: Server was running old script versions with bash-specific code

### Error Patterns You Were Seeing:
```
[[: not found                    # Bash syntax in POSIX shell
mov: not found                   # Failed parsing causing shell to try executing extension as command
Skipping unsupported file type   # Files not being processed correctly
```

## What We Fixed

### Script Changes Made:

1. **Replaced all `[[ ]]` with POSIX `case` statements:**
   ```bash
   # OLD (Bash-only):
   if [[ "$extension" == "mov" || "$extension" == "mp4" ]]; then

   # NEW (POSIX-compatible):
   case "$extension" in
       mov|mp4)
   ```

2. **Added proper error handling:**
   ```bash
   exit_code=$?
   if [ $exit_code -ne 0 ]; then
   ```

3. **Enhanced debug output:**
   ```bash
   echo "DEBUG: Processing video file with ffmpeg..."
   echo "DEBUG: Extension: '$extension'"
   ```

4. **Added dependency checks:**
   ```bash
   if ! command -v ffmpeg >/dev/null 2>&1; then
       echo "ERROR: ffmpeg command not found."
       exit 1
   fi
   ```

## Frontend Gallery Issues

The frontend was broken because:

1. **No thumbnails were being generated** due to script failures
2. **Gallery.js couldn't find thumbnail files** in `content/thumbnails/`
3. **Empty gallery** resulted from failed image processing

### After fixing scripts, the frontend should:
- ✅ Display thumbnails properly
- ✅ Show video play icons
- ✅ Open video/image modals correctly
- ✅ Handle file uploads automatically via dirmonitor

## File Structure Verification

Ensure your directory structure looks like this:
```
/home/container/www/
├── content/                 # Your original media files
│   ├── video1.mp4
│   ├── image1.jpg
│   └── ...
├── content/thumbnails/      # Generated thumbnails
│   ├── video1.jpg          # Video thumbnails as JPG
│   ├── image1.jpg          # Resized images
│   └── ...
├── compress.sh             # Fixed compression script
├── dirmonitor.sh           # Fixed monitoring script
├── index.html              # Gallery frontend
├── gallery.js              # Gallery logic
└── style.css               # Gallery styles
```

## Testing Commands

### Test thumbnail generation:
```bash
# Run compression manually
cd /home/container/www
./compress.sh

# Check if thumbnails were created
ls -la content/thumbnails/

# Test specific file types
echo "Testing with a video file..."
cp content/test.mp4 content/test-copy.mp4
# Should generate content/thumbnails/test-copy.jpg
```

### Test monitoring:
```bash
# Start monitor in debug mode
./dirmonitor.sh

# In another terminal, add a test file
cp content/existing.jpg content/new-test.jpg
# Should see debug output and thumbnail creation
```

### Test frontend:
```bash
# Check if gallery loads
curl http://your-server/images/
# Should show the HTML gallery page

# Check if thumbnails are accessible
curl http://your-server/images/content/thumbnails/
# Should list thumbnail files
```

## Common Container Environment Issues

### If you're still getting `[[: not found` errors:

1. **Force POSIX mode:**
   ```bash
   # Run with explicit shell
   /bin/sh /home/container/www/compress.sh
   ```

2. **Check actual shell being used:**
   ```bash
   # In the script
   echo "Actual shell: $(readlink /proc/$$/exe)"
   ```

3. **Container-specific fixes:**
   ```bash
   # Some containers override shebang, force bash:
   bash /home/container/www/compress.sh
   
   # Or install bash if missing:
   apk add bash  # Alpine
   apt-get install bash  # Debian/Ubuntu
   ```

## Performance Optimization

After fixing the scripts, you may want to optimize:

1. **Batch processing for many files:**
   ```bash
   # Process multiple files in parallel
   find content -name "*.mp4" -print0 | xargs -0 -P 4 -I {} ./process-single.sh {}
   ```

2. **Monitor resource usage:**
   ```bash
   # Check ffmpeg processes
   ps aux | grep ffmpeg
   
   # Monitor disk space
   df -h content/thumbnails/
   ```

## Success Verification

You'll know everything is working when:

1. ✅ No more `[[: not found` errors in logs
2. ✅ Thumbnails appear in `content/thumbnails/` directory
3. ✅ Frontend gallery displays images and videos
4. ✅ New files added to `content/` automatically get thumbnails
5. ✅ Video files show play icons
6. ✅ Clicking videos/images opens modals correctly

Run the test command and you should see proper debug output without errors:
```bash
./compress.sh 2>&1 | head -20
```

Expected output:
```
DEBUG: Starting compress.sh script
DEBUG: Input directory: /home/container/www/content
DEBUG: Output directory: /home/container/www/content/thumbnails
DEBUG: Shell: ./compress.sh
DEBUG: Bash version: 5.1.16 (or "Not running in bash, using POSIX shell")
==================================
DEBUG: Processing file: example.mp4
DEBUG: Extension: 'mp4'
DEBUG: Video file detected, output filename: example.jpg
Processing example.mp4...
DEBUG: Processing video file with ffmpeg...
Successfully created thumbnail for example.mp4
```
