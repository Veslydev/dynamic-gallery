input_directory="/home/container/www/content"
output_directory="/home/container/www/content/thumbnails"

# monitor the directory for new files
inotifywait -m -e moved_to -e close_write -e create --format "%w%f" $input_directory | while read -r newfile
do
    if [ -f "$newfile" ]; then
        filename=$(basename "$newfile")
        extension="${filename##*.}"
        extension=$(echo "$extension" | tr '[:upper:]' '[:lower:]')
        
        # Generate thumbnail filename (always as .jpg for videos)
        if [[ "$extension" == "mov" || "$extension" == "mp4" ]]; then
            output_filename="${filename%.*}.jpg"
        else
            output_filename="$filename"
        fi
        
        output_path="$output_directory/$output_filename"

        # Different ffmpeg commands for videos vs images
        if [[ "$extension" == "mov" || "$extension" == "mp4" ]]; then
            # For videos: extract frame at 1 second and scale
            ffmpeg -i "$newfile" -ss 00:00:01.000 -vf "scale=iw*0.75:ih*0.75" -vframes 1 -q:v 3 "$output_path"
        else
            # For images: scale and compress
            ffmpeg -i "$newfile" -vf "scale=iw*0.75:ih*0.75" -q:v 3 -vframes 1 "$output_path"
        fi
    fi
done
