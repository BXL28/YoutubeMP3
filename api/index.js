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

app.set("views", path.join(__dirname, "../views")); 
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => res.render("index"));

// STEP 1: Get the link and title immediately
app.post("/get-link", async (req, res) => {
    const { videoId } = req.body;
    if (!videoId) return res.status(400).json({ success: false, message: "No ID provided" });

    try {
        let videoTitle = `YouTube_${videoId}`;
        try {
            const info = await axios.get(`https://youtube-mp3-audio-video-downloader.p.rapidapi.com/get-video-info/${videoId}`, {
                params: { response_mode: 'default' },
                headers: { 'x-rapidapi-key': process.env.API_KEY, 'x-rapidapi-host': 'youtube-mp3-audio-video-downloader.p.rapidapi.com' }
            });
            if (info.data?.title) videoTitle = info.data.title.replace(/[^\w\s-]/gi, '').trim();
        } catch (e) { console.log("Title fetch failed, using fallback."); }

        const dl = await axios.get(`https://youtube-mp3-audio-video-downloader.p.rapidapi.com/get_mp3_download_link/${videoId}`, {
            params: { quality: 'low', wait_until_the_file_is_ready: 'false' },
            headers: { 'x-rapidapi-key': process.env.API_KEY, 'x-rapidapi-host': 'youtube-mp3-audio-video-downloader.p.rapidapi.com' }
        });

        const downloadUrl = dl.data.file ? dl.data.file.replace(/\\/g, '') : null;
        if (!downloadUrl) throw new Error("API provided no download link.");

        res.json({ success: true, downloadUrl, videoTitle });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// STEP 2: Apply effects
app.post("/apply-effect", async (req, res) => {
    const { downloadUrl, effect, videoTitle } = req.body;
    const filename = `processed_${Date.now()}.mp3`;
    const tempOutput = path.join(tempDir, filename);

    try {
        let ffmpegArgs = ['-i', downloadUrl, '-y'];
        
        // Applying requested audio effects
        if (effect === 'sped_up') {
            ffmpegArgs.push('-af', 'atempo=1.2');
        } else if (effect === 'hq_8D') {
            ffmpegArgs.push('-af', 'apulsator=mode=sine:amount=0.5:offset_l=0:offset_r=0.5:hz=0.125,loudnorm=I=-16:TP=-1:LRA=4,volume=0.9');
        } else if (effect === 'slow_reverb') {
            ffmpegArgs.push('-af', 'volume=0.8,asetrate=44100*0.8909,atempo=0.85,aresample=44100:resampler=swr:internal_sample_fmt=fltp,lowpass=f=5000,chorus=0.4:0.4:55:0.4:1.5:0.04,loudnorm=I=-14:TP=-1.5:LRA=7,alimiter=limit=0.95');
        }
        
        ffmpegArgs.push(tempOutput);

        await new Promise((resolve, reject) => {
            const proc = spawn(ffmpegStatic, ffmpegArgs);
            proc.on('close', (code) => code === 0 ? resolve() : reject(new Error("FFmpeg failed")));
        });

        res.json({ success: true, song_title: videoTitle, tempFilename: filename });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// STEP 3: The Download Route with Dynamic Naming
app.get("/download/:filename", (req, res) => {
    const filePath = path.join(tempDir, req.params.filename);
    const rawTitle = req.query.title || "processed_audio";
    const safeTitle = `${rawTitle.replace(/[^\w\s-]/gi, '')}.mp3`;

    if (fs.existsSync(filePath)) {
        res.download(filePath, safeTitle, (err) => {
            if (!err) {
                try { fs.unlinkSync(filePath); } catch (e) {} 
            }
        });
    } else {
        res.status(404).send("File expired.");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports = app;