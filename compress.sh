input_directory="/home/container/www/content"
output_directory="/home/container/www/content/thumbnails"

for file in $input_directory/*
do
    # Skip if not a file
    if [ ! -f "$file" ]; then
        continue
    fi

    filename=$(basename "$file")
    extension="${filename##*.}"
    extension=$(echo "$extension" | tr '[:upper:]' '[:lower:]')
    
    # Skip hidden files and system files
    if [[ "$filename" == .* ]]; then
        continue
    fi
    
    # Generate thumbnail filename (always as .jpg for videos)
    if [[ "$extension" == "mov" || "$extension" == "mp4" ]]; then
        output_filename="${filename%.*}.jpg"
    else
        output_filename="$filename"
    fi
    
    output_path="$output_directory/$output_filename"

    # Skip if thumbnail already exists
    if [ -f "$output_path" ]; then
        echo "Thumbnail already exists for $filename, skipping..."
        continue
    fi

    echo "Processing $filename..."

    # Different ffmpeg commands for videos vs images
    if [[ "$extension" == "mov" || "$extension" == "mp4" ]]; then
        # For videos: extract frame at 1 second and scale, with fallback to first frame if 1s doesn't exist
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
        # For images: scale and compress
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

echo "Thumbnail generation complete!" Hey, I got your wedding present. One can look on your home now let's get this party started. Let's go to the song. Look what I wanted. The carnival. She's beautiful. 