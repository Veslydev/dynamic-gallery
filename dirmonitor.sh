#!/bin/bash

input_directory="/home/container/www/content"
output_directory="/home/container/www/content/thumbnails"

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
    mkdir -p "$output_directory"
fi

inotifywait -m -e moved_to -e close_write -e create --format "%w%f" "$input_directory" | while read -r newfile; do
    if [ -f "$newfile" ]; then
        filename=$(basename "$newfile")
        extension="${filename##*.}"
        extension=$(echo "$extension" | tr '[:upper:]' '[:lower:]')
        
        # Skip hidden files (starting with .) - POSIX compatible
        case "$filename" in
            .*)
                continue
                ;;
        esac
        
        # Set output filename based on file type - POSIX compatible
        case "$extension" in
            mov|mp4)
                output_filename="${filename%.*}.jpg"
                ;;
            *)
                output_filename="$filename"
                ;;
        esac
        
        output_path="$output_directory/$output_filename"

        # Check if thumbnail already exists
        if [ -f "$output_path" ]; then
            echo "Thumbnail already exists for $filename, skipping..."
            continue
        fi

        echo "Processing new file: $filename..."

        # Use POSIX compatible case statement
        case "$extension" in
            mov|mp4)
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
                ffmpeg -i "$newfile" -vf "scale=iw*0.75:ih*0.75" -q:v 3 -vframes 1 "$output_path" -y 2>/dev/null
                exit_code=$?
                if [ $exit_code -eq 0 ]; then
                    echo "Successfully created thumbnail for $filename"
                else
                    echo "Failed to create thumbnail for $filename"
                fi
                ;;
            *)
                echo "Skipping unsupported file type: $filename"
                ;;
        esac
    fi
done
