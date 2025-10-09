document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/sudokugenerate')
        .then(response => response.json())
        .then(data => {
            console.log(data); // <-- Add this line
            // Use the correct property from the API response
            const board = data.puzzle;
            const container = document.querySelector('.sudoku-container');
            
            // Create table
            const table = document.createElement('table');
            table.className = 'sudoku-grid';
            
            for (let i = 0; i < board.length; i++) {
                const row = document.createElement('tr');
                for (let j = 0; j < board[i].length; j++) {
                    const cell = document.createElement('td');
                    // add row and column classes for styling
                    cell.classList.add(`row-${i+1}`, `col-${j+1}`);
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
        });
});