require('dotenv').config();
const express = require("express");
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');
const tempDir = os.tmpdir();

const ffmpegStatic = require('ffmpeg-static');
const YTDlpWrap = require('yt-dlp-wrap').default;

const app = express();

app.set("views", path.join(__dirname, "../views")); 
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Helper function to download yt-dlp binary if it's missing
const ytDlpBinaryPath = path.join(tempDir, 'yt-dlp');
async function ensureYtDlp() {
    if (!fs.existsSync(ytDlpBinaryPath)) {
        console.log('Downloading standalone Linux binary...');
        // FIX: Call the method on the Class 'YTDlpWrap', not an undefined 'ytDlp'
        await YTDlpWrap.downloadFromGithub(
            ytDlpBinaryPath, 
            'latest', 
            'yt-dlp_linux' 
        ); 
        fs.chmodSync(ytDlpBinaryPath, '755');
    }
    return ytDlpBinaryPath;
}

app.get("/", (req, res) => res.render("index"));

app.post("/convert-mp3", async (req, res) => {
    const { videoId, audioEffect = 'normal' } = req.body;
    if (!videoId) return res.render("index", { success: false, message: "Please enter a video ID" });

    const tempOutput = path.join(tempDir, `ytmp3_${Date.now()}.mp3`);

    try {
        const executablePath = await ensureYtDlp();
        const ytDlpCustom = new YTDlpWrap(executablePath);

        console.log('Starting standalone download...');
        await ytDlpCustom.execPromise([
            `https://www.youtube.com/watch?v=${videoId}`,
            '-x', '--audio-format', 'mp3',
            '--ffmpeg-location', ffmpegStatic,
            '-o', tempOutput
        ]);

        let title = `Song_${videoId}`;
        // ... (Your existing FFmpeg effects logic goes here) ...

        res.render("index", { success: true, song_title: title, song_link: `file://${tempOutput}` });
    } catch (err) {
        console.error('Error:', err.message);
        res.render("index", { success: false, message: `Error: ${err.message}` });
    }
});

app.get("/download-mp3", async (req, res) => { /* ... existing download-mp3 logic ... */ });

module.exports = app;
if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => console.log(`Server running on http://localhost:3000`));
}