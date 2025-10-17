const express = require('express');
const path = require('path'); 
const app = express();
const PORT = 3000;

// keep last generated puzzle (only .puzzle) in memory
let lastGeneratedPuzzle = null;

// Serve static files (HTML, JS, CSS)
app.use(express.static(path.join(__dirname)));

// Example API endpoint - generate puzzle (store only .puzzle)
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
        .then(json => {
            // store only the .puzzle property
            lastGeneratedPuzzle = json.puzzle || null;
            // respond with only the puzzle array
            res.json({ puzzle: lastGeneratedPuzzle });
        })
        .catch(err => {
            console.error('error:' + err);
            res.status(500).json({ error: 'Failed to fetch Sudoku puzzle' });
        });
});

// NEW: call external sudokusolve API using the last generated .puzzle
// Sends Content-Type: application/json and width/height both set to 3
app.get('/api/sudokusolve', (req, res) => {
    if (!lastGeneratedPuzzle || !Array.isArray(lastGeneratedPuzzle)) {
        return res.status(400).json({ error: 'No generated puzzle available. Call /api/sudokugenerate first.' });
    }

    const url = 'https://api.api-ninjas.com/v1/sudokusolve';
    const options = {
        method: 'POST',
        headers: {
            'User-Agent': 'insomnia/11.6.1',
            'X-Api-Key': '1zekGxh6bYp7FRHq++yg2w==Ujz1EvjPmSt9U9Ab',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            puzzle: lastGeneratedPuzzle,
            width: 3,
            height: 3
        })
    };

    fetch(url, options)
        .then(apiRes => apiRes.json())
        .then(json => res.json(json))
        .catch(err => {
            console.error('error:' + err);
            res.status(500).json({ error: 'Failed to solve Sudoku puzzle' });
        });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

