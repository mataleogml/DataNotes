document.addEventListener("DOMContentLoaded", function() {
    fetch('data.json')
      .then(response => response.json())
      .then(data => createGrid(data));
  });
  
  function createGrid(data) {
    const gridContainer = document.getElementById('gridContainer');
    
    // Determine number of columns based on device width
    const numColumns = window.innerWidth >= 768 ? Infinity : 5;
    
    gridContainer.style.gridTemplateColumns = `repeat(${numColumns}, 1fr)`;
    
    data.forEach((item, index) => {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.innerText = item.text;
      
      // Dynamically assign color based on category
      const color = getCategoryColor(item.category, index);
      cell.style.backgroundColor = color;
      
      gridContainer.appendChild(cell);
    });
  }
  
  function getCategoryColor(category, index) {
    // Generate a color based on the category name and index
    const hue = (index * 137.508) % 360;
    const saturation = 80 + (index * 5) % 20;
    const lightness = 70;
    
    // Convert HSL to RGB
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
  