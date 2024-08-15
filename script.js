// Get the window dimensions
const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

// Calculate relative sizes
const width = Math.min(windowWidth * 0.9, 1200); // 90% of window width, max 1200px
const height = Math.min(windowHeight * 0.8, 800); // 80% of window height, max 800px
const padding = Math.max(width * 0.01, 4); // 1% of width, minimum 4px
const squareSize = Math.max(width * 0.08, 60); // 8% of width, minimum 60px
const groupPadding = Math.max(height * 0.20, 100); // 15% of height, minimum 100px

const svg = d3.select("#visualization")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

function getColorByType(type) {
    const colors = {
        "interview": "#ff9999",
        "focus_group": "#99ff99",
        "affinization": "#9999ff"
    };
    return colors[type] || "#cccccc";
}

document.addEventListener('DOMContentLoaded', function() {
    const popup = document.getElementById("popup");
    if (popup) {
        popup.style.display = "none";
    }

    const closeButton = document.querySelector(".close");
    if (closeButton) {
        closeButton.addEventListener("click", closePopup);
    } else {
        console.error("Close button not found");
    }
});

d3.csv("data.csv").then(function(data) {
    createVisualization(data);
}).catch(function(error) {
    console.log("Error loading the CSV file:", error);
});

function createVisualization(data) {
    // Filter for level 0 notes and group by parent_note
    const level0Data = data.filter(d => d.level === "0");
    const groupedData = d3.group(level0Data, d => d.parent_note);

    // Calculate total height needed
    const totalHeight = Array.from(groupedData).length * groupPadding + squareSize;
    svg.attr("height", Math.max(height, totalHeight));

    // Create a group for each parent note
    const groups = svg.selectAll("g")
        .data(Array.from(groupedData))
        .enter()
        .append("g")
        .attr("transform", (d, i) => `translate(10, ${i * groupPadding + 20})`);

    // Add parent note label
    groups.append("text")
        .attr("x", 0)
        .attr("y", -10)
        .text(d => {
            const parentNote = data.find(note => note.note_id === d[0]);
            return parentNote ? parentNote.insight : "Unknown";
        })
        .attr("font-size", "12px")
        .attr("font-weight", "bold");

    // Create squares for each note in the group
    groups.each(function(d) {
        const noteGroup = d3.select(this).selectAll("g")
            .data(d[1])
            .enter()
            .append("g")
            .attr("transform", (d, i) => `translate(${i * (squareSize + padding)}, 0)`);

        noteGroup.append("rect")
            .attr("width", squareSize)
            .attr("height", squareSize)
            .attr("fill", d => getColorByType(d.type))
            .attr("rx", squareSize * 0.02)
            .attr("ry", squareSize * 0.02)
            .style("stroke", "rgba(0, 0, 0, 0.1)")
            .style("stroke-width", "2px")
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut)
            .on("click", handleClick);

        noteGroup.append("text")
            .attr("x", squareSize / 2)
            .attr("y", squareSize / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .style("fill", "#333")
            .style("pointer-events", "none")
            .text(d => d.insight)
            .call(fitTextToSquare, squareSize - 6);
    });
}

function fitTextToSquare(text, squareSize) {
    text.each(function() {
        const textElement = d3.select(this);
        const words = textElement.text().split(/\s+/);
        let fontSize = 12; // Start with a smaller font size
        let lineHeight = 1.1;
        
        textElement.style("font-size", null); // Reset font size
        
        while (fontSize > 6) { // Minimum font size
            let lines = [];
            let line = [];
            let tspan = textElement.text(null).append("tspan").attr("x", 0).attr("y", 0);
            
            for (let word of words) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > squareSize - 6) {
                    line.pop();
                    lines.push(line.join(" "));
                    line = [word];
                    tspan = textElement.append("tspan").attr("x", 0).attr("dy", `${lineHeight}em`).text(word);
                }
            }
            lines.push(line.join(" "));
            
            if (lines.length * fontSize * lineHeight <= squareSize - 6) {
                // Text fits, render it
                textElement.selectAll("tspan").remove();
                lines.forEach((line, i) => {
                    textElement.append("tspan")
                        .attr("x", squareSize / 2)
                        .attr("y", (squareSize / 2) - ((lines.length - 1) * lineHeight * fontSize / 2) + (i * lineHeight * fontSize))
                        .text(line);
                });
                break;
            }
            
            fontSize -= 1;
            textElement.style("font-size", `${fontSize}px`);
        }
        
        // If text still doesn't fit, truncate it
        if (fontSize <= 6) {
            textElement.selectAll("tspan").remove();
            textElement.text(words.join(" ").substring(0, 20) + "...");
        }
        
        textElement.attr("dominant-baseline", null);
    });
}

function handleMouseOver(event, d) {
    const growth = 1.1; // 10% growth
    d3.select(this)
        .transition()
        .duration(200)
        .style("transform", `scale(${growth})`)
        .style("transform-origin", "center")
        .style("z-index", 10);
}

function handleMouseOut(event, d) {
    d3.select(this)
        .transition()
        .duration(200)
        .style("transform", "scale(1)")
        .style("z-index", 1);
}

function handleClick(event, d) {
    const clickedElement = event.target;
    const rect = clickedElement.getBoundingClientRect();
    const startX = rect.left + window.scrollX;
    const startY = rect.top + window.scrollY;
    const startWidth = rect.width;
    const startHeight = rect.height;

    const popup = document.getElementById("popup");
    const popupContent = document.querySelector(".popup-content");
    const popupTitle = document.getElementById("popup-title");
    const popupInsight = document.getElementById("popup-insight");

    if (popup && popupContent && popupTitle && popupInsight) {
        // Create temporary element for animation
        const temp = document.createElement('div');
        temp.style.position = 'fixed';
        temp.style.left = startX + 'px';
        temp.style.top = startY + 'px';
        temp.style.width = startWidth + 'px';
        temp.style.height = startHeight + 'px';
        temp.style.backgroundColor = getColorByType(d.type);
        temp.style.borderRadius = '5px';
        temp.style.transition = 'all 0.3s ease-in-out';
        temp.style.zIndex = '1000';
        document.body.appendChild(temp);

        // Set content and style for actual popup
        popupTitle.textContent = `Note ID: ${d.note_id}`;
        popupInsight.textContent = d.insight;
        popupContent.style.backgroundColor = getColorByType(d.type);
        
        // Trigger animation
        setTimeout(() => {
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const popupWidth = 300; // Set this to match your CSS
            const popupHeight = 300; // Set this to match your CSS
            const endX = (windowWidth - popupWidth) / 2;
            const endY = (windowHeight - popupHeight) / 2;
            
            temp.style.left = endX + 'px';
            temp.style.top = endY + 'px';
            temp.style.width = popupWidth + 'px';
            temp.style.height = popupHeight + 'px';
        }, 50);

        // Show actual popup and remove temp element
        setTimeout(() => {
            popup.style.display = "flex";
            popup.classList.add('show');
            document.body.removeChild(temp);
        }, 350);
    } else {
        console.error("Popup elements not found");
    }
}

function closePopup() {
    const popup = document.getElementById("popup");
    const popupContent = document.querySelector(".popup-content");
    if (popup && popupContent) {
        const rect = popupContent.getBoundingClientRect();
        const endX = rect.left + window.scrollX;
        const endY = rect.top + window.scrollY;
        const endWidth = rect.width;
        const endHeight = rect.height;

        // Create temporary element for closing animation
        const temp = document.createElement('div');
        temp.style.position = 'fixed';
        temp.style.left = endX + 'px';
        temp.style.top = endY + 'px';
        temp.style.width = endWidth + 'px';
        temp.style.height = endHeight + 'px';
        temp.style.backgroundColor = popupContent.style.backgroundColor;
        temp.style.borderRadius = '5px';
        temp.style.transition = 'all 0.3s ease-in-out';
        temp.style.zIndex = '1000';
        document.body.appendChild(temp);

        // Hide the actual popup
        popup.classList.remove('show');
        popup.style.display = "none";

        // Trigger closing animation
        setTimeout(() => {
            const lastClickedElement = document.querySelector('rect:hover');
            if (lastClickedElement) {
                const rect = lastClickedElement.getBoundingClientRect();
                temp.style.left = (rect.left + window.scrollX) + 'px';
                temp.style.top = (rect.top + window.scrollY) + 'px';
                temp.style.width = rect.width + 'px';
                temp.style.height = rect.height + 'px';
            } else {
                temp.style.transform = 'scale(0)';
            }
        }, 50);

        // Remove temp element after animation
        setTimeout(() => {
            document.body.removeChild(temp);
        }, 350);
    } else {
        console.error("Popup elements not found");
    }
}

window.addEventListener("click", function(event) {
    const popup = document.getElementById("popup");
    if (popup && event.target === popup) {
        closePopup();
    }
});

// Add a resize event listener
window.addEventListener('resize', debounce(() => {
    updateVisualization();
}, 250));

function updateVisualization() {
    // Recalculate dimensions
    const newWindowWidth = window.innerWidth;
    const newWindowHeight = window.innerHeight;
    const newWidth = Math.min(newWindowWidth * 0.9, 1200);
    const newHeight = Math.min(newWindowHeight * 0.8, 800);
    
    // Update SVG size
    svg.attr("width", newWidth)
       .attr("height", newHeight);
    
    // Recalculate other dimensions
    const newPadding = Math.max(newWidth * 0.01, 4);
    const newSquareSize = Math.max(newWidth * 0.08, 60);
    const newGroupPadding = Math.max(newHeight * 0.15, 100);
    
    // Redraw the visualization
    d3.csv("data.csv").then(function(data) {
        svg.selectAll("*").remove(); // Clear existing content
        createVisualization(data); // Recreate visualization with new dimensions
    }).catch(function(error) {
        console.log("Error loading the CSV file:", error);
    });
}

// Debounce function to limit how often the resize function is called
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}