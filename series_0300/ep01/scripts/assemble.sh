#!/bin/bash
# usage: scripts/assemble.sh <framesDir> <fps> <out.mp4>
ffmpeg -y -framerate $2 -i $1/f_%05d.jpg -i assets/mix.wav -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -vf "scale=1080:1920" -c:a aac -b:a 192k -shortest -movflags +faststart $3
