require('dotenv').config();
const express = require("express");
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');
const axios = require('axios');
const ffmpegStatic = require('ffmpeg-static');

const app = express();
const tempDir = os.tmpdir();

// View Engine & Middleware
app.set("views", path.join(__dirname, "../views")); 
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/convert-mp3", async (req, res) => {
  const videoId = req.body.videoId;
  const effect = req.body.audioEffect || 'normal';
  let videoTitle = `YouTube_${videoId}`; // Fallback title

  if (!videoId) {
    return res.render("index", { success: false, message: "Please enter a video ID" });
  }

  const tempOutput = path.join(tempDir, `processed_${Date.now()}.mp3`);

  try {
    console.log(`\n--- STARTING PROCESS: ${videoId} ---`);

    // 1. Fetch Video Title
    try {
        console.log(`[Status]: Fetching video info...`);
        const infoRes = await axios.get(`https://youtube-mp3-audio-video-downloader.p.rapidapi.com/get-video-info/${videoId}`, {
            params: { response_mode: 'default' },
            headers: {
                'x-rapidapi-key': process.env.API_KEY,
                'x-rapidapi-host': 'youtube-mp3-audio-video-downloader.p.rapidapi.com'
            }
        });
        if (infoRes.data && infoRes.data.title) {
            videoTitle = infoRes.data.title.replace(/[^\w\s-]/gi, '').trim();
            console.log(`[Status]: Real Title Found: ${videoTitle}`);
        }
    } catch (titleErr) {
        console.warn(`[Warning]: Title fetch failed. Defaulting to ID. Error: ${titleErr.message}`);
    }

    // 2. Request Download Link
    const response = await axios.get(`https://youtube-mp3-audio-video-downloader.p.rapidapi.com/get_mp3_download_link/${videoId}`, {
      params: {
        quality: 'low',
        wait_until_the_file_is_ready: 'false'
      },
      headers: {
        'x-rapidapi-key': process.env.API_KEY,
        'x-rapidapi-host': 'youtube-mp3-audio-video-downloader.p.rapidapi.com'
      }
    });

    let downloadUrl = response.data.file ? response.data.file.replace(/\\/g, '') : null;

    if (!downloadUrl) {
        throw new Error("No download link found in the API response.");
    }

    console.log(`[Status]: Download Link Obtained: ${downloadUrl}`);
    
    // 3. Mandatory Generation Buffer
    console.log("Waiting 60 seconds for server-side generation (Prevents 404)...");
    await new Promise(resolve => setTimeout(resolve, 60000));

    // 4. FFmpeg Processing
    console.log(`[Status]: Starting FFmpeg with effect: ${effect}`);
    let ffmpegArgs = ['-i', downloadUrl, '-y'];

    if (effect === 'sped_up') {
      ffmpegArgs.push('-af', 'atempo=1.2');
    } else if (effect === 'hq_8D') {
      ffmpegArgs.push('-af', 'apulsator=mode=sine:amount=0.5:offset_l=0:offset_r=0.5:hz=0.125,loudnorm=I=-16:TP=-1:LRA=4,volume=0.9');
    } else if (effect === 'slow_reverb') {
      ffmpegArgs.push('-af', 'volume=0.8,asetrate=44100*0.8909,atempo=0.85,aresample=44100:resampler=swr:internal_sample_fmt=fltp,lowpass=f=5000,chorus=0.4:0.4:55:0.4:1.5:0.04,loudnorm=I=-14:TP=-1.5:LRA=7,alimiter=limit=0.95');
    }

    ffmpegArgs.push(tempOutput);

    await new Promise((resolve, reject) => {
      const ffmpegProc = spawn(ffmpegStatic, ffmpegArgs);
      let errorLog = "";

      ffmpegProc.stderr.on('data', (data) => {
        errorLog += data.toString();
        const line = data.toString().trim().split('\n').pop();
        if (line.includes('size=')) console.log(`[FFmpeg]: ${line}`);
      });

      ffmpegProc.on('close', (code) => {
        if (code === 0) resolve();
        else {
          console.error("FFmpeg Error Details:", errorLog);
          reject(new Error(`FFmpeg failed with code ${code}`));
        }
      });
    });

    // 5. Final Render (Browser stays on page, NO automatic download)
    res.render("index", { 
      success: true, 
      song_title: `${videoTitle} (${effect.toUpperCase()})`, 
      song_link: `file://${tempOutput}` 
    });

  } catch (err) {
    console.error(`\n--- FINAL ERROR ---`);
    console.error(`Message: ${err.message}`);
    res.render("index", { success: false, message: `Error: ${err.message}` });
  }
});

// Download Route
app.get("/download-mp3", (req, res) => {
  const { url, title } = req.query;
  const filePath = decodeURIComponent(url).replace('file://', '');
  
  if (fs.existsSync(filePath)) {
    res.download(filePath, `${title || 'song'}.mp3`, (err) => {
      if (!err && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Cleanup local file
      }
    });
  } else {
    res.status(404).send("File not found.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));

module.exports = app;