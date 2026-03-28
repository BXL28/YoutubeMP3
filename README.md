<div align="center">

# 🎵 YouTube to MP3 Converter
**A web-based tool to download and customize YouTube audio with high-fidelity effects.**

<div align="center">
  <a href="https://www.bxlyoutubetomp3.com" target="_blank">
    <b>View Live Project</b>
  </a>
</div>

</div>

## 🚀 Features
* **Custom Audio Effects:** Apply specialized filters before downloading:
    * **8D Audio:** Immersive spatial panning for a surround-sound experience.
    * **Slowed + Reverb:** Creates "lo-fi" or atmospheric versions of your favorite tracks.
    * **Sped Up:** Increases tempo for high-energy playback.
* **Optimized Architecture:** Uses a specialized two-step client-side polling process to bypass Vercel's 10-second serverless timeout limits.
* **Smart Metadata:** Automatically fetches and embeds the original video title into the MP3 file naming.

---

## 🛠️ Technical Architecture
* **Backend:** Node.js & Express
* **API Integration:** Leverages **RapidAPI** for stable, high-speed YouTube data extraction.
* **Audio Engine:** Built with **FFmpeg (fluent-ffmpeg)** for real-time audio manipulation.
* **Deployment:** Hosted on **Vercel** with a decoupled processing logic to ensure reliable large-file handling.

---

## 📖 How to Use

### 1. Locate the Video ID
Find the characters following `v=` in any YouTube URL.
> **Example:** `https://www.youtube.com/watch?v=dQw4w9WgXcQ` → Video ID is **dQw4w9WgXcQ**

### 2. Enter ID & Select Effects
Paste the ID into the input field and choose your desired audio enhancement.

<p align="center">
  <img width="1864" height="887" alt="image" src="https://github.com/user-attachments/assets/d6b3005e-3f55-42eb-9d21-28409f1ecad6" />

</p>

<p align="center">
  <img width="583" height="526" alt="image" src="https://github.com/user-attachments/assets/39aecc0f-d30c-4480-ada8-c174980de640" />

</p>

### 3. Convert & Download
Click **Convert** and wait for the system to fetch the link and apply effects. Once ready, click the download button to save your enhanced MP3!

<p align="center">
  <img width="1468" height="702" alt="image" src="https://github.com/user-attachments/assets/eb808cfe-64c5-485b-93b6-fbc94b221621" />

</p>

<p align="center">
  <img width="800" alt="Download Ready" src="https://github.com/user-attachments/assets/6ecde917-a7bb-4e8c-99f2-095e70f82ab8" />
</p>







