                      YouTube to MP3 Converter
A web-based application that allows users to download audio from YouTube videos with customizable sound effects.

Link: https://youtube-mp-3-6q5eownp1-bxl28s-projects.vercel.app

Features
Easy Conversion: Download high-quality audio by simply providing the YouTube Video ID.

Audio Customization: Apply effects before downloading:

  - Sped Up: Increase the tempo of your favorite tracks.

  - 8D Audio: Experience immersive surround sound.

  - Slowed + Reverb: Create "lo-fi" or atmospheric versions of songs.

Optimized Conversion: Uses a two-step client-side polling process to ensure reliable downloads without hitting serverless timeout limits.

Metadata Integration: Automatically fetches and applies the correct video title to your downloaded file.

🛠️ Technical Architecture
To ensure stability and speed, this project utilizes a modern full-stack approach:

  Backend: Node.js & Express.
  
  API Integration: Leverages RapidAPI for stable, high-speed YouTube data extraction and conversion.
  
  Audio Engine: Built with FFmpeg (fluent-ffmpeg) for real-time audio manipulation.
  
  Deployment: Optimized for Vercel, featuring a specialized architecture to bypass standard 10-second serverless execution limits.

How to Use:
Locate the Video ID in a YouTube URL (the characters following v=).

Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ&start_radio=1 → Video ID is dQw4w9WgXcQ

Paste the ID into the input field.
<img width="1858" height="916" alt="image" src="https://github.com/user-attachments/assets/fcd51620-f4de-42be-a2e9-5dbf747ac684" />

Select your desired audio effect (optional).
<img width="1857" height="944" alt="image" src="https://github.com/user-attachments/assets/8bcedf3e-212d-4ae3-acd4-5405752036f0" />


Click Convert and what for link to be fetched and any effects to be added
<img width="1847" height="922" alt="image" src="https://github.com/user-attachments/assets/aa3d17a2-092b-46a7-bfcb-22127466c56f" />

Then Download your enhanced Mp3 file!
<img width="1849" height="919" alt="image" src="https://github.com/user-attachments/assets/6ecde917-a7bb-4e8c-99f2-095e70f82ab8" />






