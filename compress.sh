#!/bin/bash

input_directory="/home/container/www/content"
output_directory="/home/container/www/content/thumbnails"

# Check if required commands exist
if ! command -v ffmpeg >/dev/null 2>&1; then
    echo "ERROR: ffmpeg command not found. Please install ffmpeg package."
    exit 1
fi

# Create output directory if it doesn't exist
if [ ! -d "$output_directory" ]; then
    mkdir -p "$output_directory"
fi

# Check if input directory exists
if [ ! -d "$input_directory" ]; then
    echo "ERROR: Input directory does not exist: $input_directory"
    exit 1
fi

for file in "$input_directory"/*; do
    # Check if there are actually files to process
    if [ ! -e "$file" ]; then
        echo "No files found in $input_directory"
        break
    fi
    
    if [ ! -f "$file" ]; then
        continue
    fi

    filename=$(basename "$file")
    extension="${filename##*.}"
    extension=$(echo "$extension" | tr '[:upper:]' '[:lower:]')
    
    # Skip hidden files (starting with .)
    case "$filename" in
        .*) continue ;;
    esac
    
    # Set output filename based on file type
    case "$extension" in
        mov|mp4)
            output_filename="${filename%.*}.jpg"
            ;;
        *)
            output_filename="$filename"
            ;;
    esac
    
    output_path="$output_directory/$output_filename"

    if [ -f "$output_path" ]; then
        continue
    fi

    case "$extension" in
        mov|mp4)
            ffmpeg -i "$file" -ss 00:00:01.000 -vf "scale=iw*0.75:ih*0.75" -vframes 1 -q:v 3 "$output_path" -y 2>/dev/null
            exit_code=$?
            if [ $exit_code -ne 0 ]; then
                ffmpeg -i "$file" -vf "scale=iw*0.75:ih*0.75" -vframes 1 -q:v 3 "$output_path" -y 2>/dev/null
                exit_code=$?
            fi
            if [ $exit_code -ne 0 ]; then
                echo "Failed to create thumbnail for $filename"
            fi
            ;;
        jpg|jpeg|png|gif|webp|bmp)
            ffmpeg -i "$file" -vf "scale=iw*0.75:ih*0.75" -q:v 3 -vframes 1 "$output_path" -y 2>/dev/null
            exit_code=$?
            if [ $exit_code -ne 0 ]; then
                echo "Failed to create thumbnail for $filename"
            fi
            ;;
        *)
            ;;
    esac
done

echo "Thumbnail generation complete!"
