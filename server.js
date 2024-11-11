const path = require("path");
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const https = require('https');
const Docker = require('dockerode');
const docker = new Docker(); // Defaults to connecting to the local Docker daemon

// Custom HTTPS agent
const agent = new https.Agent({  
  rejectUnauthorized: false  // Disable certificate validation (use with caution)
});

const port = process.env.PORT || 8080;

const app = express();

// app.use(cors());
app.use(cors({
    origin: '*', // Set this to your frontend domain for production
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "index.html"));
});


// Redirect HTTP to HTTPS (only in production)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Accept');
  
  if (process.env.NODE_ENV === 'production' && req.header("x-forwarded-proto") !== "https") {
    res.redirect(`https://${req.header("host")}${req.url}`);
  } else {
    next();
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
