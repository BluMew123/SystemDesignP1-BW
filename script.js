document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/sudoku')
        .then(response => response.json())
        .then(data => {
            // Use the correct property from the API response
            const board = data.grid;
            const container = document.querySelector('.sudoku-container');
            
            // Create table
            const table = document.createElement('table');
            table.className = 'sudoku-grid';
            
            for (let i = 0; i < board.length; i++) {
                const row = document.createElement('tr');
                for (let j = 0; j < board[i].length; j++) {
                    const cell = document.createElement('td');
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