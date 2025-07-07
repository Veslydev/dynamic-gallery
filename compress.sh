#!/usr/bin/env bash

input_directory="/home/container/www/content"
output_directory="/home/container/www/content/thumbnails"

for file in "$input_directory"/*
do
    if [ ! -f "$file" ]; then
        continue
    fi

    filename=$(basename "$file")
    extension="${filename##*.}"
    extension=$(echo "$extension" | tr '[:upper:]' '[:lower:]')
    
    if [[ "$filename" == .* ]]; then
        continue
    fi
    
    if [[ "$extension" == "mov" || "$extension" == "mp4" ]]; then
        output_filename="${filename%.*}.jpg"
    else
        output_filename="$filename"
    fi
    
    output_path="$output_directory/$output_filename"

    if [ -f "$output_path" ]; then
        echo "Thumbnail already exists for $filename, skipping..."
        continue
    fi

    echo "Processing $filename..."

    if [[ "$extension" == "mov" || "$extension" == "mp4" ]]; then
        ffmpeg -i "$file" -ss 00:00:01.000 -vf "scale=iw*0.75:ih*0.75" -vframes 1 -q:v 3 "$output_path" -y 2>/dev/null
        if [ $? -ne 0 ]; then
            echo "Failed at 1 second, trying first frame for $filename..."
            ffmpeg -i "$file" -vf "scale=iw*0.75:ih*0.75" -vframes 1 -q:v 3 "$output_path" -y 2>/dev/null
        fi
        if [ $? -eq 0 ]; then
            echo "Successfully created thumbnail for $filename"
        else
            echo "Failed to create thumbnail for $filename"
        fi
    elif [[ "$extension" == "jpg" || "$extension" == "jpeg" || "$extension" == "png" || "$extension" == "gif" || "$extension" == "webp" || "$extension" == "bmp" ]]; then
        ffmpeg -i "$file" -vf "scale=iw*0.75:ih*0.75" -q:v 3 -vframes 1 "$output_path" -y 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "Successfully created thumbnail for $filename"
        else
            echo "Failed to create thumbnail for $filename"
        fi
    else
        echo "Skipping unsupported file type: $filename"
    fi
done

echo "Thumbnail generation complete!"
