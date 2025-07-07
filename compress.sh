input_directory="/home/container/www/content"
output_directory="/home/container/www/content/thumbnails"

for file in $input_directory/*
do
    filename=$(basename "$file")
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
        ffmpeg -i "$file" -ss 00:00:01.000 -vf "scale=iw*0.75:ih*0.75" -vframes 1 -q:v 3 "$output_path"
    else
        # For images: scale and compress
        ffmpeg -i "$file" -vf "scale=iw*0.75:ih*0.75" -q:v 3 -vframes 1 "$output_path"
    fi
done
Like you're doing your laundry, I guess, 'cause my parents keep telling me to be more ladylike. My folks were always on me to groom myself and wear underpants. Yeah. What you say? See last night, right? Suck me pants. Have you ever wondered what goes on inside the school after everyone leaves? Took the classrooms and frame shadows with all the lights go off. How is that? Doesn't know what really happens the hallway when my friends and I decided to smoke in the school at night. We'll start as a fun inventor. Quickly turned into a nightmare. Workers are inside a school effort. Antiques. 