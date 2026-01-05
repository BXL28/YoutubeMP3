require('dotenv').config();

const express = require("express");

const fetch = require("node-fetch");
const request = require('request');



const app = express();


const PORT = process.env.PORT || 3000;


app.set("view engine", "ejs");
app.use(express.static('public'));


app.use(express.urlencoded({
  extended: true
}));
app.use(express.json());


app.get("/", (req, res) => {
  res.render("index");
});

const https = require("https");

app.get("/download-mp3", async (req, res) => {
  const { url, title } = req.query;
  if (!url) return res.status(400).send("No URL provided.");

  try {
    const decodedUrl = decodeURIComponent(url);

    https.get(decodedUrl, (response) => {
      if (response.statusCode !== 200) {
        return res.status(500).send("Failed to download. Possibly expired or not cached.");
      }

      res.setHeader("Content-Disposition", `attachment; filename="${title || 'song'}.mp3"`);
      res.setHeader("Content-Type", "audio/mpeg");
      response.pipe(res);

    }).on("error", (err) => {
      console.error("Download error:", err.message);
      res.status(500).send("Download failed.");
    });

  } catch (err) {
    console.error("Handler error:", err.message);
    res.status(500).send("Something went wrong.");
  }
});



app.post("/convert-mp3", async (req, res) => {
  const videoId = req.body.videoId;
  if (!videoId) {
    return res.render("index", { success: false, message: "Please enter a video ID" });
  }

  try {
    const fetchAPI = await fetch(`https://youtube-mp3-audio-video-downloader.p.rapidapi.com/download-mp3/${videoId}`, {
      method: "GET",
      headers: {
        "x-rapidapi-key": process.env.API_KEY,
        "x-rapidapi-host": process.env.API_HOST
      }
    });

    if (!fetchAPI.ok) {
      return res.render("index", { success: false, message: "Failed to fetch MP3." });
    }

    const buffer = await fetchAPI.arrayBuffer();

    res.setHeader("Content-Disposition", `attachment; filename="${videoId}.mp3"`);
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(Buffer.from(buffer));

  } catch (err) {
    console.error(err);
    res.render("index", { success: false, message: "Something went wrong." });
  }
});




app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
