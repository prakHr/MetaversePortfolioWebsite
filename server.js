const path = require("path");
const { chromium } = require('playwright-core');
const express = require('express')
// ADD THIS
var cors = require('cors');

const Docker = require('dockerode');
const docker = new Docker(); // Defaults to connecting to the local Docker daemon

// Function to run a container
async function runContainer(description) {
    try {
        const image = 'docker.io/gprakhar/adv-search11';
        const imageTag = 'latest';

        // console.log(`Pulling image ${image}:${imageTag}...`);
        await docker.pull(`${image}:${imageTag}`);
        // console.log('Image pulled successfully.');

        // Step 2: Create the container with an environment variable
        const container = await docker.createContainer({
            Image: `${image}:${imageTag}`,
            Cmd: ['node', 'googleSearch.js'],
            Env: [`description=${description}`],
            Tty: true,
        });

        // Step 3: Start the container
        await container.start();
        // console.log('Container started successfully.');

        // Step 4: Capture the container output
        const stream = await container.logs({
            follow: true,
            stdout: true,
            stderr: true,
        });

        let output = ''; // Buffer to accumulate log data

        // Collect the logs as data streams in chunks
        stream.on('data', (data) => {
            output += data.toString();
        });

        // Wait for the container to stop
        await container.wait();
        // console.log('Container has stopped.');

        // Optional: Remove the container after it stops
        await container.remove();
        // console.log('Container removed successfully.');

        // console.log(output);
        // Return the accumulated output
        return output;

    } catch (error) {
        // console.error(`Error: ${error.message}`);
        throw error; // Rethrow the error to be caught in .catch()
    }
}

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

app.get('/advSearch', (req, res) => {
  // console.log(req.body);
  const username = req.query.data;
  console.log(`username: ${username}`);
  runContainer(username)
  .then(inputString => {
    // console.log(typeof(inputString));
    // console.log(inputString);

    // Step 1: Remove ANSI color codes
    inputString = inputString.replace(/\u001b\[\d+m/g, "");

    // Step 2: Add double quotes around keys
    inputString = inputString.replace(/(\w+):/g, '"$1":');

    // Step 3: Fix the malformed URLs
    // Fix incorrect "https":// to "https://"
    inputString = inputString.replace(/"https":\/\//g, '"https://');

    // Step 4: Remove stray characters like extra quotes
    inputString = inputString.replace(/""/g, '"');  // Ensure that there aren't two double quotes before the URL

    // Step 5: Clean up any malformed URLs or stray characters
    inputString = inputString.replace(/'"/g, '"');  // Remove stray single quotes that may appear
    inputString = inputString.replace("\\'",'"');

    // Step 1: Remove unwanted escape sequences (for example, ANSI color codes or mismatched quotes)
    inputString = inputString.replace(/"https":\/\/([^"]+)"/g, '"$1"');

    // Step 2: Ensure URLs are properly formatted and fix any unmatched single or double quotes
    inputString = inputString.replace(/['"]+/g, '"'); // Fix extraneous quotes

    // Debugging output to see the modified string before JSON parsing
    // console.log("Modified string:", inputString);

    try {
      // Step 6: Parse the cleaned-up string to JSON
      let jsonObject = JSON.parse(inputString);
      // console.log("Parsed JSON Object:", jsonObject);

      // Send the JSON response back to the client
      res.json(jsonObject);
      // res.redirect(req.originalUrl);
    } catch (parseError) {
      // Log parsing errors and send an error response
      // console.error("JSON parsing error:", parseError);
      res.status(500).json({ error: 'Invalid JSON format in response' });
    }
  })
  .catch(error => {
    console.error("Error running container:", error);
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