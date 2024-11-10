// docker run -e description="Your custom description here" docker.io/gprakhar/adv-search11
const Docker = require('dockerode');
const docker = new Docker(); // Defaults to connecting to the local Docker daemon

// Function to run a container
async function runContainer(description) {
    try {
        const image = 'docker.io/gprakhar/adv-search11';
        const imageTag = 'latest';

        console.log(`Pulling image ${image}:${imageTag}...`);
        await docker.pull(`${image}:${imageTag}`);
        console.log('Image pulled successfully.');

        // Step 2: Create the container with an environment variable
        const container = await docker.createContainer({
            Image: `${image}:${imageTag}`,
            Cmd: ['node', 'googleSearch.js'],
            Env: [`description=${description}`],
            Tty: true,
        });

        // Step 3: Start the container
        await container.start();
        console.log('Container started successfully.');

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
        console.log('Container has stopped.');

        // Optional: Remove the container after it stops
        await container.remove();
        console.log('Container removed successfully.');

        // console.log(output);
        // Return the accumulated output
        return output;

    } catch (error) {
        console.error(`Error: ${error.message}`);
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
