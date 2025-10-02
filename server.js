const express = require('express');
const path = require('path');
const fetch = require('node-fetch'); // Make sure node-fetch is installed
const app = express();
const PORT = 3000;

// Serve static files (HTML, JS, CSS)
app.use(express.static(path.join(__dirname)));

// Example API endpoint
app.get('/api/sudokugenerate', (req, res) => {
    let url = 'https://api.api-ninjas.com/v1/sudokugenerate?width=3&height=3&difficulty=medium';
    let options = {
        method: 'GET',
        headers: {
            'User-Agent': 'insomnia/11.6.1',
            'X-Api-Key': '1zekGxh6bYp7FRHq++yg2w==Ujz1EvjPmSt9U9Ab'
        }
    };

    fetch(url, options)
        .then(apiRes => apiRes.json())
        .then(json => res.json(json)) // Send the API response to the frontend
        .catch(err => {
            console.error('error:' + err);
            res.status(500).json({ error: 'Failed to fetch Sudoku puzzle' });
        });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

