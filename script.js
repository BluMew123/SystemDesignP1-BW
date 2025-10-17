document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/sudokugenerate')
        .then(response => response.json())
        .then(data => {
            console.log(data); // debug API response

            // accept multiple possible property names returned by different APIs
            const board = data.puzzle || data.grid || data.board || data;
            const container = document.querySelector('.sudoku-container');

            if (!Array.isArray(board) || board.length === 0) {
                if (container) container.innerHTML = '<p>Failed to load Sudoku puzzle.</p>';
                return;
            }

            // Create table
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

                    // add row, column and box classes for styling
                    cell.classList.add('cell', `row-${rowNum}`, `col-${colNum}`, `box-${boxNum}`);

                    // set id and data attributes for easy selection/manipulation
                    cell.id = `cell-r${rowNum}c${colNum}`;
                    cell.setAttribute('data-row', rowNum);
                    cell.setAttribute('data-col', colNum);
                    cell.setAttribute('data-box', boxNum);

                    // show number, empty if 0
                    cell.textContent = board[i][j] !== 0 ? board[i][j] : '';

                    row.appendChild(cell);
                }
                table.appendChild(row);
            }

            container.innerHTML = ''; // Clear previous content
            container.appendChild(table);

            // --- ADDED: highlight behavior on cell click ---
            // clicked cell -> .cell-selected
            // same row/col/box -> .cell-related
            table.addEventListener('click', (event) => {
                const td = event.target.closest('td');
                if (!td) return;

                // clear previous highlights
                document.querySelectorAll('.cell-selected, .cell-related').forEach(el => {
                    el.classList.remove('cell-selected', 'cell-related');
                });

                // highlight clicked cell
                td.classList.add('cell-selected');

                // get identifiers
                const row = td.getAttribute('data-row');
                const col = td.getAttribute('data-col');
                const box = td.getAttribute('data-box');

                // highlight related cells (same row OR same col OR same box), excluding clicked cell
                const relatedSelector = `.cell.row-${row}, .cell.col-${col}, .cell.box-${box}`;
                document.querySelectorAll(relatedSelector).forEach(el => {
                    if (el !== td) el.classList.add('cell-related');
                });
            });
            // --- end added behavior ---
        })
        .catch(error => {
            console.error('Error fetching Sudoku:', error);
            const container = document.querySelector('.sudoku-container');
            if (container) container.innerHTML = '<p>Error loading puzzle.</p>';
        });
});