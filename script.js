document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.sudoku-container');
    let currentBoard = null;       // puzzle as generated (.puzzle)
    let selectedCell = null;       // DOM td element currently selected
    let lastSolution = null;       // cached solution from /api/sudokusolve

    // helper: render board (expects 2D array)
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

                // original puzzle value: non-zero fixed numbers should be marked readonly
                const val = board[i][j];
                cell.textContent = val !== 0 ? val : '';
                if (val !== 0) {
                    cell.classList.add('cell-fixed');
                    cell.setAttribute('data-fixed', '1');
                }

                row.appendChild(cell);
            }
            table.appendChild(row);
        }

        container.innerHTML = '';
        container.appendChild(table);

        // click handling for selection (delegated)
        table.addEventListener('click', (event) => {
            const td = event.target.closest('td');
            if (!td) return;

            // ignore clicks on fixed cells for selection? still allow selection to see hints
            // clear previous selection/related/result highlights
            clearHighlights();

            selectedCell = td;
            td.classList.add('cell-selected');

            const row = td.getAttribute('data-row');
            const col = td.getAttribute('data-col');
            const box = td.getAttribute('data-box');

            // highlight related
            const relatedSelector = `.cell.row-${row}, .cell.col-${col}, .cell.box-${box}`;
            document.querySelectorAll(relatedSelector).forEach(el => {
                if (el !== td) el.classList.add('cell-related');
            });
        });
    }

    // clear selection, related and result highlights
    function clearHighlights() {
        selectedCell = null;
        document.querySelectorAll('.cell-selected, .cell-related, .cell-correct, .cell-incorrect').forEach(el => {
            el.classList.remove('cell-selected', 'cell-related', 'cell-correct', 'cell-incorrect');
        });
    }

    // load a generated puzzle from server and render
    function loadGeneratedPuzzle() {
        fetch('/api/sudokugenerate')
            .then(r => r.json())
            .then(data => {
                // server responds with { puzzle: [...] }
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
            .then(r => r.json())
            .then(data => {
                // accept several possible response shapes
                const sol = data.solution || data.puzzle || data.grid || data;
                if (!Array.isArray(sol)) throw new Error('Invalid solution format');
                lastSolution = sol;
                return sol;
            });
    }

    // input number into selected cell (if not fixed)
    function inputNumber(n) {
        if (!selectedCell) return;
        if (selectedCell.getAttribute('data-fixed') === '1') return; // do not overwrite fixed
        selectedCell.textContent = String(n);
        selectedCell.setAttribute('data-user', String(n));
        // remove previous result highlights for this cell
        selectedCell.classList.remove('cell-correct', 'cell-incorrect');
    }

    // check current board against solution; highlight each cell green/red
    function checkAnswer() {
        if (!currentBoard) return;
        fetchSolution()
            .then(solution => {
                // solution is a 2D array matching currentBoard dims
                const cells = document.querySelectorAll('.sudoku-grid td');
                cells.forEach(td => {
                    td.classList.remove('cell-correct', 'cell-incorrect');
                    const r = parseInt(td.getAttribute('data-row'), 10) - 1;
                    const c = parseInt(td.getAttribute('data-col'), 10) - 1;
                    const expected = solution[r][c];
                    const providedText = td.textContent.trim();
                    const provided = providedText === '' ? 0 : parseInt(providedText, 10);
                    if (provided === expected) {
                        td.classList.add('cell-correct');
                    } else {
                        td.classList.add('cell-incorrect');
                    }
                });
            })
            .catch(err => {
                console.error('Error fetching solution for check:', err);
            });
    }

    // fill board with solution (solve)
    function solveMyPuzzle() {
        if (!currentBoard) return;
        fetchSolution()
            .then(solution => {
                const cells = document.querySelectorAll('.sudoku-grid td');
                cells.forEach(td => {
                    const r = parseInt(td.getAttribute('data-row'), 10) - 1;
                    const c = parseInt(td.getAttribute('data-col'), 10) - 1;
                    td.textContent = solution[r][c];
                    td.classList.remove('cell-incorrect');
                    td.classList.add('cell-correct');
                });
            })
            .catch(err => {
                console.error('Error fetching solution for solve:', err);
            });
    }

    // hookup keypad buttons (delegated)
    document.addEventListener('click', (ev) => {
        const kb = ev.target.closest('.keypad-btn');
        if (kb) {
            const val = kb.getAttribute('data-value');
            if (val) inputNumber(parseInt(val, 10));
        }
        const gen = ev.target.closest('#generate-btn');
        if (gen) {
            clearHighlights();
            loadGeneratedPuzzle();
        }
        const chk = ev.target.closest('#check-btn');
        if (chk) {
            clearHighlights();
            checkAnswer();
        }
        const slv = ev.target.closest('#solve-btn');
        if (slv) {
            clearHighlights();
            solveMyPuzzle();
        }
    });

    // initial load of a puzzle
    loadGeneratedPuzzle();
});