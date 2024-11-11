// pages/api/search.js
import { default as axios } from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Log the request body to verify incoming data
    console.log('Request Body:', req.body);

    // Retrieve query data from the body (not params)
    const queryData = req.body.query;
    console.log('Query Data:', queryData);

    try {
      const response = await axios.post('https://vercel-docker.onrender.com/api/search', 
        { query: queryData }, 
        { timeout: 60000 }
      );
      
      // Handle the response from the external server
      console.log('Search Results:', response.data);

      // Return the response data to the client
      return res.status(200).json({ success: response.data });
    } catch (error) {
      // Handle errors (e.g., network issues, server issues)
      console.error('Error fetching search results:', error);
      return res.status(404).json({ error: error.message });
    }
  } else {
    // If the method is not POST, return a method not allowed error
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
}
