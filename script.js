document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/sudokugenerate')
        .then(response => response.json())
        .then(data => {
            console.log(data); // debug API response

            // accept multiple possible property names returned by different APIs
            const board = data.grid || data.puzzle || data.board || data;
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
        })
        .catch(error => {
            console.error('Error fetching Sudoku:', error);
            const container = document.querySelector('.sudoku-container');
            if (container) container.innerHTML = '<p>Error loading puzzle.</p>';
        });
});