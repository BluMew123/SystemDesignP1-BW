/* used AI heavily throughout this file, as I built my project with CoPilot */
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.sudoku-container');
    const keypadArea = document.querySelector('.sudoku-keypad');
    const generateBtn = document.getElementById('generate-btn');
    const checkBtn = document.getElementById('check-btn');
    const solveBtn = document.getElementById('solve-btn');

    let currentBoard = null;       // puzzle as generated (.puzzle)
    let selectedCell = null;       // DOM td element currently selected
    let lastSolution = null;       // cached solution from /api/sudokusolve

    // render the board (expects 2D array)
    function renderBoard(board) {
        currentBoard = board;
        lastSolution = null; // clear cached solution when new puzzle loaded

        const table = document.createElement('table');
        table.className = 'sudoku-grid';

        for (let i = 0; i < board.length; i++) {
            const row = document.createElement('tr');
            for (let j = 0; j < board[i].length; j++) {
                const cell = document.createElement('td');

                const rowNum = i + 1;
                const colNum = j + 1;
                const boxRow = Math.floor(i / 3);
                const boxCol = Math.floor(j / 3);
                const boxNum = boxRow * 3 + boxCol + 1; // 1..9

                cell.classList.add('cell', `row-${rowNum}`, `col-${colNum}`, `box-${boxNum}`);
                cell.id = `cell-r${rowNum}c${colNum}`;
                cell.setAttribute('data-row', rowNum);
                cell.setAttribute('data-col', colNum);
                cell.setAttribute('data-box', boxNum);

                const val = board[i][j];
                cell.textContent = val !== 0 ? val : '';
                if (val !== 0) {
                    cell.classList.add('cell-fixed');
                    cell.setAttribute('data-fixed', '1');
                    // expose prefilled value in DOM for inspection
                    cell.setAttribute('data-value', String(val));
                } else {
                    // ensure no leftover attributes on empty cells
                    cell.removeAttribute('data-value');
                    cell.removeAttribute('data-user');
                }

                row.appendChild(cell);
            }
            table.appendChild(row);
        }

        container.innerHTML = '';
        container.appendChild(table);
    }

    // select a cell and apply highlights
    function selectCell(td) {
        if (!td || !td.matches('td.cell')) return;
        clearHighlights(false); // keep selectedCell cleared then set below
        selectedCell = td;
        td.classList.add('cell-selected');

        // debug log
        console.log('selected cell:', td.id);

        const row = td.getAttribute('data-row');
        const col = td.getAttribute('data-col');
        const box = td.getAttribute('data-box');

        const relatedSelector = `.cell.row-${row}, .cell.col-${col}, .cell.box-${box}`;
        document.querySelectorAll(relatedSelector).forEach(el => {
            if (el !== td) el.classList.add('cell-related');
        });
    }

    // clear selection, related and result highlights
    // if clearSelection === true, also unset selectedCell
    function clearHighlights(clearSelection = true) {
        if (clearSelection) selectedCell = null;
        document.querySelectorAll('.cell-selected, .cell-related, .cell-correct, .cell-incorrect').forEach(el => {
            el.classList.remove('cell-selected', 'cell-related', 'cell-correct', 'cell-incorrect');
        });
    }

    // load a generated puzzle from server and render
    function loadGeneratedPuzzle() {
        fetch('/api/sudokugenerate')
            .then(r => {
                if (!r.ok) throw new Error('Failed to fetch puzzle');
                return r.json();
            })
            .then(data => {
                const puzzle = data.puzzle || data;
                if (!Array.isArray(puzzle) || puzzle.length === 0) {
                    container.innerHTML = '<p>Failed to load Sudoku puzzle.</p>';
                    return;
                }
                renderBoard(puzzle);
            })
            .catch(err => {
                console.error('Error fetching generated puzzle:', err);
                container.innerHTML = '<p>Error loading puzzle.</p>';
            });
    }

    // request solution from server (/api/sudokusolve uses server-side stored puzzle)
    function fetchSolution() {
        return fetch('/api/sudokusolve')
            .then(r => {
                if (!r.ok) throw new Error('Failed to fetch solution');
                return r.json();
            })
            .then(data => {
                const sol = data.solution || data.puzzle || data.grid || data;
                if (!Array.isArray(sol)) throw new Error('Invalid solution format');
                lastSolution = sol;
                return sol;
            });
    }

    // input number into selected cell (if not fixed) and update model
    function inputNumber(n) {
        // guard against null/undefined so "null" doesn't appear
        if (n == null) return;
        if (!selectedCell) return;
        if (selectedCell.getAttribute('data-fixed') === '1') return; // do not overwrite fixed

        // update DOM
        selectedCell.textContent = String(n);
        selectedCell.setAttribute('data-user', String(n));
        selectedCell.setAttribute('data-value', String(n)); // visible in inspector
        selectedCell.classList.remove('cell-incorrect');
        selectedCell.classList.add('cell-user'); // mark as user-filled

        // update currentBoard model so checks/solve use latest user input
        const r = parseInt(selectedCell.getAttribute('data-row'), 10) - 1;
        const c = parseInt(selectedCell.getAttribute('data-col'), 10) - 1;
        if (Array.isArray(currentBoard) && currentBoard[r]) {
            currentBoard[r][c] = Number(n);
        }
    }

    // clear selected cell (keyboard / delete)
    function clearSelectedCell() {
        if (!selectedCell) return;
        if (selectedCell.getAttribute('data-fixed') === '1') return;
        selectedCell.textContent = '';
        selectedCell.removeAttribute('data-user');
        selectedCell.removeAttribute('data-value');
        selectedCell.classList.remove('cell-user', 'cell-correct', 'cell-incorrect');

        const r = parseInt(selectedCell.getAttribute('data-row'), 10) - 1;
        const c = parseInt(selectedCell.getAttribute('data-col'), 10) - 1;
        if (Array.isArray(currentBoard) && currentBoard[r]) {
            currentBoard[r][c] = 0;
        }
    }

    // keyboard support: type 1-9 to input, Backspace/Delete/0 to clear
    document.addEventListener('keydown', (ev) => {
        if (!selectedCell) return;
        // ignore when typing into other inputs (if any)
        if (['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;

        const k = ev.key;
        if (/^[1-9]$/.test(k)) {
            ev.preventDefault();
            inputNumber(Number(k));
        } else if (k === 'Backspace' || k === 'Delete' || k === '0') {
            ev.preventDefault();
            clearSelectedCell();
        }
    });

    // Delegated click handler for grid cells (attach once)
    if (container) {
        container.addEventListener('click', (ev) => {
            const td = ev.target.closest('td.cell');
            if (!td) return;
            selectCell(td);
        });
    }

    // Robust delegated click handler for keypad number buttons:
    function handleKeypadClick(ev) {
        const btn = ev.target.closest('.keypad-btn');
        if (!btn) return false;
        const val = btn.getAttribute('data-value');
        if (!val) return false;
        ev.preventDefault();
        // ensure selectedCell still set (debug)
        console.log('keypad clicked:', val, 'selectedCell before input:', selectedCell ? selectedCell.id : null);
        inputNumber(parseInt(val, 10));
        return true;
    }

    // attach keypad handler to keypadArea if present, otherwise fallback to document
    if (keypadArea) {
        keypadArea.addEventListener('click', handleKeypadClick);
    } else {
        document.addEventListener('click', (ev) => {
            handleKeypadClick(ev);
        });
    }

    // Hook up control buttons (generate / check / solve) - preserve existing behavior
    if (generateBtn) generateBtn.addEventListener('click', () => { clearHighlights(); loadGeneratedPuzzle(); });
    // if (checkBtn) checkBtn.addEventListener('click', () => { clearHighlights(false); checkAnswer(); });
    if (solveBtn) solveBtn.addEventListener('click', () => { clearHighlights(false); solveMyPuzzle(); });

    // Replace or add this robust solver handler and wiring
    async function solveMyPuzzle() {
        try {
            const res = await fetch('/api/sudokusolve');
            const rawText = await res.text();

            // log raw response for debugging
            console.log('/api/sudokusolve raw response text:', rawText);

            let data;
            try {
                data = JSON.parse(rawText);
            } catch (e) {
                console.warn('Response was not valid JSON, using text as message');
                data = { message: rawText };
            }

            console.log('/api/sudokusolve parsed response:', data);

            // Attempt to extract solution from multiple possible keys
            let solution = null;
            if (Array.isArray(data)) solution = data;
            else if (Array.isArray(data.solution)) solution = data.solution;
            else if (Array.isArray(data.puzzle)) solution = data.puzzle;
            else if (Array.isArray(data.grid)) solution = data.grid;
            else if (Array.isArray(data.board)) solution = data.board;

            if (!solution) {
                console.error('Invalid solution format from /api/sudokusolve', data);
                return;
            }

            // ensure 9x9
            if (!Array.isArray(solution) || solution.length !== 9 || !solution.every(row => Array.isArray(row) && row.length === 9)) {
                console.error('Solution is not a 9x9 array', solution);
                return;
            }

            // populate DOM cells and update model
            const cells = document.querySelectorAll('.sudoku-grid td');
            if (!cells || cells.length === 0) {
                if (typeof renderBoard === 'function') {
                    renderBoard(solution);
                    currentBoard = solution.map(row => row.slice());
                    return;
                }
                console.error('No sudoku grid found to populate.');
                return;
            }

            cells.forEach(td => {
                const r = parseInt(td.getAttribute('data-row'), 10) - 1;
                const c = parseInt(td.getAttribute('data-col'), 10) - 1;
                const val = solution[r][c] || 0;
                td.textContent = String(val);
                td.setAttribute('data-value', String(val));
                td.removeAttribute('data-user');
                td.classList.remove('cell-incorrect', 'cell-user');
                td.classList.add('cell-correct');
            });

            currentBoard = solution.map(row => row.slice());
        } catch (err) {
            console.error('solveMyPuzzle error:', err);
        }
    }

    // re-wire solve button
    if (typeof solveBtn !== 'undefined' && solveBtn) {
        try { solveBtn.removeEventListener('click', solveMyPuzzle); } catch(e){}
        solveBtn.addEventListener('click', (ev) => {
            ev.preventDefault();
            if (typeof clearHighlights === 'function') clearHighlights(false);
            solveMyPuzzle();
        });
    }

    // initial load of a puzzle
    loadGeneratedPuzzle();
});