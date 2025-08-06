
const express = require("express");

const fetch = require("node-fetch");
const request = require('request');

require('dotenv').config()


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
    // Parse the MP3 URL
    const decodedUrl = decodeURIComponent(url);

    // Initiate download request with custom headers
    https.get(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 ' + process.env.RAPIDAPI_USERNAME,
        'X-RUN': 'YOUR_MD5_HASH_OF_USERNAME'  // optional, if API requires it
      }
    }, (response) => {
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
  
  if(videoId === undefined ||videoId === "" ||videoId === null){
    return res.render("index", { success : false, message : "Please enter a video ID"});
  } else {
    
    const fetchAPI = await fetch(`https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`, {
      "method": "GET",
      "headers": {
        "x-rapidapi-key": process.env.API_KEY,
        "x-rapidapi-host": process.env.API_HOST
        }
    });

    const fetchResponse = await fetchAPI.json();
 
    if(fetchResponse.status === "ok")
      return res.render("index",{ success : true,  song_title : fetchResponse.title, song_link : fetchResponse.link})
    else
      return res.render("index", { success : false, message : fetchResponse.msg});
  }
});




app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
