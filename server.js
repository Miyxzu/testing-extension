// const WebSocket = require('ws');

// const wss = new WebSocket.Server({ port: 8080 });

// wss.on('connection', (ws) => {
//     ws.on('message', (message) => {
//         console.log(`Received: ${message}`);
//     });

//     ws.send('WebSocket server connected');
// });

// console.log('WebSocket server is running on ws://localhost:8080');

// CORS Proxy
const express = require('express');
const cors = require('cors');
const { JSDOM } = require('jsdom');
const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

// Example route to fetch title
app.get('/fetch-title', async (req, res) => {
    const url = req.query.url;
    console.log(`Received request for URL: ${url}`);
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(url);
        console.log(`Fetched URL: ${url} with status: ${response.status}`);
        const html = await response.text();
        const dom = new JSDOM(html);
        const titleElement = dom.window.document.querySelector('title');
        const title = titleElement ? titleElement.textContent : 'No Title Found';
        res.json({ title });
    } catch (error) {
        console.error('Error fetching title:', error);
        res.status(500).json({ error: 'Failed to fetch title' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});