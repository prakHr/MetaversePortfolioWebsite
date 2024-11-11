// search.js - API handler for search requests
const axios = require('axios');
export default async function handler(req, res) {
  if (req.method === 'POST') {
    console.log(req.body);
    const { queryData } = req.body;
    axios.post('https://vercel-docker.onrender.com', { query: queryData })
  .then(response => {
    // Handle the response from the server
    console.log('Search Results:', response.data);

    // Example function to display the search results
    // displayUrls(response.data);
    return res.status(200).json({success:response.data});
  })
  .catch(error => {
    // Handle any errors
    console.error('Error fetching search results:', error);
  });


    if (!query) {
      return res.status(400).json({ error: 'Query parameter is missing' });
    }

  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}

// This is where you would add the actual logic to search or call another API

// const queryData = emailInput.value; // Replace with the actual search term

// // Call the API using axios.post
// axios.post('https://vercel-docker.onrender.com', { query: queryData })
//   .then(response => {
//     // Handle the response from the server
//     console.log('Search Results:', response.data);

//     // Example function to display the search results
//     displayUrls(response.data);
//   })
//   .catch(error => {
//     // Handle any errors
//     console.error('Error fetching search results:', error);
//   });

// // Example function to display URLs in the UI (you can customize this)
// function displayUrls(data) {
//   if (data.success && data.data.length > 0) {
//     const resultList = document.getElementById('results');
//     resultList.innerHTML = ''; // Clear previous results

//     data.data.forEach(item => {
//       const listItem = document.createElement('li');
//       listItem.innerHTML = `<a href="${item.url}" target="_blank">${item.title}</a>`;
//       resultList.appendChild(listItem);
//     });
//   } else {
//     console.log('No results found.');
//   }
// }
