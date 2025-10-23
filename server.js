require('dotenv').config();

const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// keep last generated puzzle (only .puzzle) in memory
let lastGeneratedPuzzle = null;

// Serve static files (HTML, JS, CSS)
app.use(express.static(path.join(__dirname)));

// --- sample generator (stores lastGeneratedPuzzle) ---
app.get('/api/sudokugenerate', (req, res) => {
    const sample = [
        [5,3,0, 0,7,0, 0,0,0],
        [6,0,0, 1,9,5, 0,0,0],
        [0,9,8, 0,0,0, 0,6,0],
        [8,0,0, 0,6,0, 0,0,3],
        [4,0,0, 8,0,3, 0,0,1],
        [7,0,0, 0,2,0, 0,0,6],
        [0,6,0, 0,0,0, 2,8,0],
        [0,0,0, 4,1,9, 0,0,5],
        [0,0,0, 0,8,0, 0,7,9]
    ];
    lastGeneratedPuzzle = sample.map(row => row.slice());
    res.json({ puzzle: lastGeneratedPuzzle });
});

// --- local backtracking solver (fallback) ---
function findEmpty(board) {
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (board[r][c] === 0) return [r, c];
    return null;
}
function isValid(board, r, c, n) {
    for (let i = 0; i < 9; i++) {
        if (board[r][i] === n) return false;
        if (board[i][c] === n) return false;
    }
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (board[br + i][bc + j] === n) return false;
    return true;
}
function solveBoard(board) {
    const empty = findEmpty(board);
    if (!empty) return true;
    const [r, c] = empty;
    for (let n = 1; n <= 9; n++) {
        if (isValid(board, r, c, n)) {
            board[r][c] = n;
            if (solveBoard(board)) return true;
            board[r][c] = 0;
        }
    }
    return false;
}

// --- proxy to external API (api-ninjas) or fallback to local solver ---
// To use api-ninjas, set environment variable API_NINJAS_KEY
app.get('/api/sudokusolve', async (req, res) => {
    if (!lastGeneratedPuzzle) {
        return res.status(400).json({ error: 'No puzzle generated yet' });
    }

    const apiKey = process.env.API_NINJAS_KEY || null;

    // try to call external API if API key present AND global fetch exists
    if (apiKey && typeof global.fetch === 'function') {
        try {
            const puzzleParam = encodeURIComponent(JSON.stringify(lastGeneratedPuzzle));
            const url = `https://api.api-ninjas.com/v1/sudokusolve?puzzle=${puzzleParam}&width=3&height=3`;
            const r = await fetch(url, { method: 'GET', headers: { 'X-Api-Key': apiKey } });
            const text = await r.text();
            let json;
            try { json = JSON.parse(text); } catch(e) { json = { message: text }; }

            // forward whatever the API returns
            return res.status(r.status).json(json);
        } catch (err) {
            console.error('External sudoku solve failed:', err);
            // fall through to local solver fallback
        }
    }

    // If no API key or external call failed, use local solver and return { solution: [...] }
    const board = lastGeneratedPuzzle.map(row => row.slice());
    const ok = solveBoard(board);
    if (!ok) return res.status(500).json({ error: 'Puzzle unsolvable by local solver' });
    return res.json({ solution: board });
});

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});

