const path = require("path");
const { chromium } = require('playwright-core');
const express = require('express')
// ADD THIS
var cors = require('cors');
const axios = require('axios');

// const Docker = require('dockerode');
// const docker = new Docker(); // Defaults to connecting to the local Docker daemon

// // Function to run a container
// async function runContainer(description) {
//     try {
//         const image = 'docker.io/gprakhar/adv-search11';
//         const imageTag = 'latest';

//         // console.log(`Pulling image ${image}:${imageTag}...`);
//         await docker.pull(`${image}:${imageTag}`);
//         // console.log('Image pulled successfully.');

//         // Step 2: Create the container with an environment variable
//         const container = await docker.createContainer({
//             Image: `${image}:${imageTag}`,
//             Cmd: ['node', 'googleSearch.js'],
//             Env: [`description=${description}`],
//             Tty: true,
//         });

//         // Step 3: Start the container
//         await container.start();
//         // console.log('Container started successfully.');

//         // Step 4: Capture the container output
//         const stream = await container.logs({
//             follow: true,
//             stdout: true,
//             stderr: true,
//         });

//         let output = ''; // Buffer to accumulate log data

//         // Collect the logs as data streams in chunks
//         stream.on('data', (data) => {
//             output += data.toString();
//         });

//         // Wait for the container to stop
//         await container.wait();
//         // console.log('Container has stopped.');

//         // Optional: Remove the container after it stops
//         await container.remove();
//         // console.log('Container removed successfully.');

//         // console.log(output);
//         // Return the accumulated output
//         return output;

//     } catch (error) {
//         // console.error(`Error: ${error.message}`);
//         throw error; // Rethrow the error to be caught in .catch()
//     }
// }

// Run the container
// const description = "tum hi ho";
// runContainer(description)
//   .then(result => {
//     console.log(result);  // Logs the result on the server
//     // res.json(result);     // Sends the result back to the client
//   })
//   .catch(error => {
//     console.error(error);
//     // res.status(500).json({ error: 'An error occurred during the search' });
//   });


const port = process.env.PORT || 8080;


const app = express()
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// console.log(path.resolve(__dirname, "index.html"));
app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "index.html"));
});


app.post('/advSearch', (req, res) => {
  const username = req.body.username;

  // Call your Docker container or any other backend logic
  axios.post('https://metaverse-portfolio-website.vercel.app/api/advSearch', { username })
    .then(response => {
      res.json(response.data);
    })
    .catch(error => {
      res.status(500).json({ error: 'An error occurred during the search' });
    });
});

// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (req.header("x-forwarded-proto") !== "https") {
    res.redirect(`https://${req.header("host")}${req.url}`);
  } else {
    next();
  }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
})