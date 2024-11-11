// search.js - API handler for search requests
// const axios = require('axios');
// const axios = require('axios/dist/browser/axios.cjs');
import { default as axios } from 'axios';
export default async function handler(req, res) {
  if (req.method === 'POST') {
    console.log(req.body);
    console.log(req.params);
    
    const  queryData  = req.params.query;
    console.log(queryData);
    axios.post('https://vercel-docker.onrender.com/api/search', { query: queryData }, { timeout: 60000 })
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
    return res.status(404).json({ error: error });
  });
}}

