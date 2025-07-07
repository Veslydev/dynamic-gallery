#!/bin/sh

# POSIX-compatible version of compress.sh
# This script should work in any POSIX shell environment

input_directory="/home/container/www/content"
output_directory="/home/container/www/content/thumbnails"

echo "DEBUG: Starting compress-posix.sh script"
echo "DEBUG: Input directory: $input_directory"
echo "DEBUG: Output directory: $output_directory"
echo "DEBUG: Shell: $0"
echo "DEBUG: Shell version: $(sh --version 2>/dev/null || echo 'Unknown shell version')"
echo "=================================="

# Check if required commands exist
if ! command -v ffmpeg >/dev/null 2>&1; then
    echo "ERROR: ffmpeg command not found. Please install ffmpeg package."
    exit 1
fi

# Create output directory if it doesn't exist
if [ ! -d "$output_directory" ]; then
    echo "DEBUG: Creating output directory: $output_directory"
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
        echo "DEBUG: No files found in $input_directory"
        break
    fi
    
    if [ ! -f "$file" ]; then
        echo "DEBUG: Skipping non-file: $file"
        continue
    fi

    filename=$(basename "$file")
    extension="${filename##*.}"
    extension=$(echo "$extension" | tr '[:upper:]' '[:lower:]')
    
    echo "DEBUG: Processing file: $filename"
    echo "DEBUG: Full path: $file"
    echo "DEBUG: Extension: '$extension'"
    
    # Skip hidden files (starting with .)
    case "$filename" in
        .*) 
            echo "DEBUG: Skipping hidden file: $filename"
            continue 
            ;;
    esac
    
    # Set output filename based on file type
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

    if [ -f "$output_path" ]; then
        echo "Thumbnail already exists for $filename, skipping..."
        continue
    fi

    echo "Processing $filename..."

    case "$extension" in
        mov|mp4)
            echo "DEBUG: Processing video file with ffmpeg..."
            ffmpeg -i "$file" -ss 00:00:01.000 -vf "scale=iw*0.75:ih*0.75" -vframes 1 -q:v 3 "$output_path" -y 2>/dev/null
            exit_code=$?
            if [ $exit_code -ne 0 ]; then
                echo "Failed at 1 second, trying first frame for $filename..."
                ffmpeg -i "$file" -vf "scale=iw*0.75:ih*0.75" -vframes 1 -q:v 3 "$output_path" -y 2>/dev/null
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
            ffmpeg -i "$file" -vf "scale=iw*0.75:ih*0.75" -q:v 3 -vframes 1 "$output_path" -y 2>/dev/null
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
done

echo "Thumbnail generation complete!"
