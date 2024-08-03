const width = 800;
const height = 600;
const padding = 5;
const squareSize = 40;
const groupPadding = 60;

const svg = d3.select("#visualization")
    .append("svg")
    .attr("width", width);

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
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut)
            .on("click", handleClick);
    });
}

function getColorByType(type) {
    const colors = {
        "interview": "#ff9999",
        "focus_group": "#99ff99",
        "affinization": "#9999ff"
    };
    return colors[type] || "#cccccc";
}

function handleMouseOver(event, d) {
    d3.select(this)
        .transition()
        .duration(200)
        .attr("width", squareSize * 1.1)
        .attr("height", squareSize * 1.1);
}

function handleMouseOut(event, d) {
    d3.select(this)
        .transition()
        .duration(200)
        .attr("width", squareSize)
        .attr("height", squareSize);
}

function handleClick(event, d) {
    console.log("Clicked note:", d);
    alert(`Note ID: ${d.note_id}\nInsight: ${d.insight}`);
}