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

function handleMouseOut(event, d) {
    d3.select(this)
        .transition()
        .duration(200)
        .attr("width", squareSize)
        .attr("height", squareSize)
        .attr("x", function() {
            const currentX = parseFloat(d3.select(this).attr("x"));
            return currentX + (squareSize * 0.1) / 2;
        })
        .attr("y", function() {
            const currentY = parseFloat(d3.select(this).attr("y"));
            return currentY + (squareSize * 0.1) / 2;
        });
}

function handleClick(event, d) {
    const popup = document.getElementById("popup");
    const popupContent = document.querySelector(".popup-content");
    const popupTitle = document.getElementById("popup-title");
    const popupInsight = document.getElementById("popup-insight");

    if (popup && popupContent && popupTitle && popupInsight) {
        popupTitle.textContent = `Note ID: ${d.note_id}`;
        popupInsight.textContent = d.insight;
        
        // Set the background color based on the datapoint type
        const backgroundColor = getColorByType(d.type);
        popupContent.style.backgroundColor = backgroundColor;
        
        popup.style.display = "flex";
    } else {
        console.error("Popup elements not found");
    }
}

function closePopup() {
    const popup = document.getElementById("popup");
    if (popup) {
        popup.style.display = "none";
    } else {
        console.error("Popup element not found");
    }
}

window.addEventListener("click", function(event) {
    const popup = document.getElementById("popup");
    if (popup && event.target === popup) {
        closePopup();
    }
});