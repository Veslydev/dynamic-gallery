#!/bin/bash

# This script is designed for bash but includes POSIX fallbacks
# If bash features fail, it will fall back to POSIX-compatible alternatives

input_directory="/home/container/www/content"
output_directory="/home/container/www/content/thumbnails"

echo "DEBUG: Starting dirmonitor.sh script"
echo "DEBUG: Input directory: $input_directory"
echo "DEBUG: Output directory: $output_directory"
echo "DEBUG: Shell: $0"
if [ -n "$BASH_VERSION" ]; then
    echo "DEBUG: Bash version: $BASH_VERSION"
else
    echo "DEBUG: Not running in bash, using POSIX shell"
fi
echo "=================================="

# Check if required commands exist
if ! command -v inotifywait >/dev/null 2>&1; then
    echo "ERROR: inotifywait command not found. Please install inotify-tools package."
    exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
    echo "ERROR: ffmpeg command not found. Please install ffmpeg package."
    exit 1
fi

# Create output directory if it doesn't exist
if [ ! -d "$output_directory" ]; then
    echo "DEBUG: Creating output directory: $output_directory"
    mkdir -p "$output_directory"
fi

inotifywait -m -e moved_to -e close_write -e create --format "%w%f" "$input_directory" | while read -r newfile; do
    if [ -f "$newfile" ]; then
        filename=$(basename "$newfile")
        extension="${filename##*.}"
        extension=$(echo "$extension" | tr '[:upper:]' '[:lower:]')
        
        echo "DEBUG: New file detected: $filename"
        echo "DEBUG: Full path: $newfile"
        echo "DEBUG: Extension: '$extension'"
        
        # Skip hidden files (starting with .) - POSIX compatible
        case "$filename" in
            .*)
                echo "DEBUG: Skipping hidden file: $filename"
                continue
                ;;
        esac
        
        # Set output filename based on file type - POSIX compatible
        echo "DEBUG: Determining output filename for extension: $extension"
        case "$extension" in
            mov|mp4)
                output_filename="${filename%.*}.jpg"
                echo "DEBUG: Video file detected, output filename: $output_filename"
                ;;
            *)
                output_filename="$filename"
                echo "DEBUG: Using original filename: $output_filename"
                ;;
        esac
        
        output_path="$output_directory/$output_filename"
        echo "DEBUG: Output path: $output_path"

        echo "Processing new file: $filename..."

        # Use POSIX compatible case statement (works in both bash and sh)
        case "$extension" in
            mov|mp4)
                echo "DEBUG: Processing video file with ffmpeg..."
                ffmpeg -i "$newfile" -ss 00:00:01.000 -vf "scale=iw*0.75:ih*0.75" -vframes 1 -q:v 3 "$output_path" -y 2>/dev/null
                exit_code=$?
                if [ $exit_code -ne 0 ]; then
                    echo "Failed at 1 second, trying first frame for $filename..."
                    ffmpeg -i "$newfile" -vf "scale=iw*0.75:ih*0.75" -vframes 1 -q:v 3 "$output_path" -y 2>/dev/null
                    exit_code=$?
                fi
                if [ $exit_code -eq 0 ]; then
                    echo "Successfully created thumbnail for $filename"
                else
                    echo "Failed to create thumbnail for $filename"
                fi
                ;;
            jpg|jpeg|png|gif|webp|bmp)
                echo "DEBUG: Processing image file with ffmpeg..."
                ffmpeg -i "$newfile" -vf "scale=iw*0.75:ih*0.75" -q:v 3 -vframes 1 "$output_path" -y 2>/dev/null
                exit_code=$?
                if [ $exit_code -eq 0 ]; then
                    echo "Successfully created thumbnail for $filename"
                else
                    echo "Failed to create thumbnail for $filename"
                fi
                ;;
            *)
                echo "DEBUG: Skipping unsupported file type: $filename (extension: $extension)"
                ;;
        esac
    fi
done
