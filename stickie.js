document.addEventListener("DOMContentLoaded", function() {
    fetch('data.json')
      .then(response => response.json())
      .then(data => createGrid(data));
  });
  
  function createGrid(data) {
    const gridContainer = document.getElementById('gridContainer');
    
    // Determine number of columns based on device width
    const numColumns = window.innerWidth >= 768 ? Infinity : 5;
    
    let cellWidth = 0;
  
    // Create cells
    data.forEach((item, index) => {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.innerText = item.text;
      
      // Dynamically assign color based on category
      const color = getCategoryColor(item.category, index);
      cell.style.backgroundColor = color;
      
      gridContainer.appendChild(cell);
    });
  
    // Duplicate the content
    gridContainer.innerHTML += gridContainer.innerHTML;
  
    // Wait for layout to settle then calculate cell size and start animation
    setTimeout(() => {
      cellWidth = gridContainer.firstElementChild.offsetWidth;
      setSquareCellSize(gridContainer, cellWidth);
      startScrollAnimation(gridContainer, cellWidth);
    }, 0);
  
    // Adjust cell size when the window is resized
    window.addEventListener('resize', function() {
      cellWidth = gridContainer.firstElementChild.offsetWidth;
      setSquareCellSize(gridContainer, cellWidth);
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
  
  function setSquareCellSize(gridContainer, width) {
    const cells = gridContainer.querySelectorAll('.cell');
    cells.forEach(cell => {
      cell.style.height = width + 'px';
    });
  }
  
  function startScrollAnimation(gridContainer, cellWidth) {
    const animationDuration = (cellWidth / 100) * 5; // Adjust this value to control scroll speed
    
    gridContainer.style.animation = `scroll ${animationDuration}s linear infinite`;
    gridContainer.style.setProperty('--offset', cellWidth + 'px');
    
    gridContainer.addEventListener('animationiteration', () => {
      gridContainer.scrollLeft = 0; // Reset scroll position when the animation iteration completes
    });
  }
  