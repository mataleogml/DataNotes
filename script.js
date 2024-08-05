const width = 800;
const height = 600;
const padding = 5;
const squareSize = 40;
const groupPadding = 60;

function getColorByType(type) {
    const colors = {
        "interview": "#ff9999",
        "focus_group": "#99ff99",
        "affinization": "#9999ff"
    };
    return colors[type] || "#cccccc";
}

const svg = d3.select("#visualization")
    .append("svg")
    .attr("width", width);

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
    svg.attr("height", totalHeight);

    // Create a group for each parent note
    const groups = svg.selectAll("g")
        .data(Array.from(groupedData))
        .enter()
        .append("g")
        .attr("transform", (d, i) => `translate(10, ${i * groupPadding + 20})`); // Added offset

    // Add parent note label
    groups.append("text")
        .attr("x", 0)
        .attr("y", -10) // Adjusted position
        .text(d => {
            const parentNote = data.find(note => note.note_id === d[0]);
            return parentNote ? parentNote.insight : "Unknown";
        })
        .attr("font-size", "12px")
        .attr("font-weight", "bold");

    // Create squares for each note in the group
    groups.each(function(d) {
        d3.select(this).selectAll("rect")
            .data(d[1])
            .enter()
            .append("rect")
            .attr("x", (d, i) => i * (squareSize + padding))
            .attr("y", 0)
            .attr("width", squareSize)
            .attr("height", squareSize)
            .attr("fill", d => getColorByType(d.type))
            .attr("rx", squareSize * 0.02) // 2% radius
            .attr("ry", squareSize * 0.02) // 2% radius
            .style("stroke", "rgba(0, 0, 0, 0.1)") // 10% opacity black
            .style("stroke-width", "2px")
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut)
            .on("click", handleClick);
    });
}

function handleMouseOver(event, d) {
    const growth = 0.1; // 10% growth
    d3.select(this)
        .transition()
        .duration(200)
        .style("transform", `scale(${1 + growth})`)
        .style("transform-origin", "center")
        .style("z-index", 10);
}

function handleMouseOut(event, d) {
    d3.select(this)
        .transition()
        .duration(200)
        .attr("width", squareSize * (1 + growth))
        .attr("height", squareSize * (1 + growth))
        .attr("x", function() {
            const currentX = parseFloat(d3.select(this).attr("x"));
            return currentX - (squareSize * growth) / 2;
        })
        .attr("y", function() {
            const currentY = parseFloat(d3.select(this).attr("y"));
            return currentY - (squareSize * growth) / 2;
        });
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