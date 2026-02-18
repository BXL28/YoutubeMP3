require('dotenv').config();
const express = require("express");
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const https = require("https");
const os = require('os');
const tempDir = os.tmpdir();

// NEW: Linux-compatible binaries for Vercel
const ffmpegStatic = require('ffmpeg-static');
const { exec: ytdlp } = require('yt-dlp-exec');

const app = express();
const PORT = process.env.PORT || 3000;

app.set("views", path.join(__dirname, "../views")); 
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "../public")));

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/download-mp3", async (req, res) => {
  const { url, title } = req.query;
  if (!url) return res.status(400).send("No URL provided.");

  try {
    const filePath = decodeURIComponent(url).replace('file://', '');
    if (fs.existsSync(filePath)) {
      const fileStream = fs.createReadStream(filePath);
      res.setHeader("Content-Disposition", `attachment; filename="${title || 'song'}.mp3"`);
      res.setHeader("Content-Type", "audio/mpeg");
      fileStream.pipe(res);
      res.on('finish', () => {
        try { fs.unlinkSync(filePath); } catch (e) { console.error("Cleanup error:", e); }
      });
    } else {
      res.status(404).send("File not found.");
    }
  } catch (err) {
    res.status(500).send("Download failed.");
  }
});

app.post("/convert-mp3", async (req, res) => {
  const videoId = req.body.videoId;
  const effect = req.body.audioEffect || 'normal';
  
  if (!videoId) {
    return res.render("index", { success: false, message: "Please enter a video ID" });
  }

  const tempOutput = path.join(tempDir, `ytmp3_${Date.now()}.mp3`);

  try {
    console.log('Downloading with yt-dlp-exec...');
    
    // FIX: Using yt-dlp-exec instead of Windows .exe
    await ytdlp(`https://www.youtube.com/watch?v=${videoId}`, {
      extractAudio: true,
      audioFormat: 'mp3',
      audioQuality: '0', // Highest quality
      output: tempOutput,
      ffmpegLocation: ffmpegStatic // Points to Linux binary
    });

    let title = `Song_${videoId}`;
    try {
        // Optional: Fetching title requires another call or using info object
        title = `Song_${videoId}`; 
    } catch (e) {}

    if (effect !== 'normal') {
      title += ` (${effect.replace('_', ' ').toUpperCase()})`;
      
      const tempInput = tempOutput.replace('.mp3', '_input.mp3');
      fs.renameSync(tempOutput, tempInput);

      let ffmpegArgs = ['-i', tempInput, '-y', tempOutput];
      
      if (effect === 'sped_up') {
        ffmpegArgs.splice(2, 0, '-filter:a', 'atempo=1.2');
      } else if (effect === 'hq_8D') {
        ffmpegArgs.splice(2, 0, '-af', 'apulsator=mode=sine:amount=0.5:offset_l=0:offset_r=0.5:hz=0.125,loudnorm=I=-16:TP=-1:LRA=4,volume=0.9');
      } else if (effect === 'slow_reverb') {
        ffmpegArgs.splice(2, 0, '-af', 'volume=0.8,asetrate=44100*0.8909,atempo=0.85,aresample=44100:resampler=swr:internal_sample_fmt=fltp,lowpass=f=5000,chorus=0.4:0.4:55:0.4:1.5:0.04,loudnorm=I=-14:TP=-1.5:LRA=7,alimiter=limit=0.95');
      }

      await new Promise((resolve, reject) => {
        // FIX: Use the static path for the spawn command
        const ffmpegProc = spawn(ffmpegStatic, ffmpegArgs);
        ffmpegProc.on('close', (code) => code === 0 ? resolve() : reject(new Error('FFmpeg failed')));
        ffmpegProc.stderr.on('data', (data) => console.log(`FFmpeg: ${data}`));
      });
      
      if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
    }

    res.render("index", { 
      success: true, 
      song_title: title, 
      song_link: `file://${tempOutput}` 
    });

  } catch (err) {
    console.error('Error:', err.message);
    res.render("index", { success: false, message: `Error: ${err.message}` });
  }
});

// For Vercel, we export the app
module.exports = app;

// Local listening for dev
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}

