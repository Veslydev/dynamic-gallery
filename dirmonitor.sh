input_directory="/home/container/www/content"
output_directory="/home/container/www/content/thumbnails"

# monitor the directory for new files
inotifywait -m -e moved_to -e close_write -e create --format "%w%f" $input_directory | while read -r newfile
do
    if [ -f "$newfile" ]; then
        filename=$(basename "$newfile")
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

        echo "Processing new file: $filename..."

        # Different ffmpeg commands for videos vs images
        if [[ "$extension" == "mov" || "$extension" == "mp4" ]]; then
            # For videos: extract frame at 1 second and scale, with fallback to first frame if 1s doesn't exist
            ffmpeg -i "$newfile" -ss 00:00:01.000 -vf "scale=iw*0.75:ih*0.75" -vframes 1 -q:v 3 "$output_path" -y 2>/dev/null
            if [ $? -ne 0 ]; then
                echo "Failed at 1 second, trying first frame for $filename..."
                ffmpeg -i "$newfile" -vf "scale=iw*0.75:ih*0.75" -vframes 1 -q:v 3 "$output_path" -y 2>/dev/null
            fi
            if [ $? -eq 0 ]; then
                echo "Successfully created thumbnail for $filename"
            else
                echo "Failed to create thumbnail for $filename"
            fi
        elif [[ "$extension" == "jpg" || "$extension" == "jpeg" || "$extension" == "png" || "$extension" == "gif" || "$extension" == "webp" || "$extension" == "bmp" ]]; then
            # For images: scale and compress
            ffmpeg -i "$newfile" -vf "scale=iw*0.75:ih*0.75" -q:v 3 -vframes 1 "$output_path" -y 2>/dev/null
            if [ $? -eq 0 ]; then
                echo "Successfully created thumbnail for $filename"
            else
                echo "Failed to create thumbnail for $filename"
            fi
        else
            echo "Skipping unsupported file type: $filename"
        fi
    fi
done
