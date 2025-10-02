fetch('/api/sudoku')
    .then(response => response.json())
    .then(data => {
        console.log(data); // Handle API response here
    })
    .catch(error => console.error('Error:', error));