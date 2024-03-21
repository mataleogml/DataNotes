let page = 1; // Initialize page number

document.addEventListener("DOMContentLoaded", function() {
    loadMoreData();
    window.addEventListener('scroll', handleScroll);
});

function handleScroll() {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 5) {
        loadMoreData();
    }
}

function loadMoreData() {
    fetch(`data.json?page=${page}`)
        .then(response => response.json())
        .then(data => {
            createGrid(data);
            page++; // Increment page number for next request
        });
}

function createGrid(data) {
    const gridContainer = document.getElementById('gridContainer');

    // Create grid items
    data.forEach(item => {
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item');
        gridItem.innerText = item.text;
        gridContainer.appendChild(gridItem);
    });
}
