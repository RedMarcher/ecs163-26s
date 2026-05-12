// Global Terrorism Database Dashboard - Bare-bones Starting Template
// Setup the environment and shared variables
const width = window.innerWidth;
const height = window.innerHeight;

// Define margin and size variables for three visualization views
// Chart 1: Temporal Overview (e.g., Line/Area chart) - Left Column, Top half
let chart1Margin = {top: 40, right: 30, bottom: 50, left: 60},
    chart1Width = (width * 0.48) - chart1Margin.left - chart1Margin.right,
    chart1Height = (height * 0.45) - chart1Margin.top - chart1Margin.bottom;

let chart1Left = chart1Margin.left,
    chart1Top = chart1Margin.top;

// Chart 2: Categorical Focus (e.g., Attack/Weapon type Bar chart) - Right Column, Top half
let chart2Margin = {top: 40, right: 30, bottom: 50, left: 60},
    chart2Width = (width * 0.48) - chart2Margin.left - chart2Margin.right,
    chart2Height = (height * 0.45) - chart2Margin.top - chart2Margin.bottom;

let chart2Left = (width * 0.5) + chart2Margin.left,
    chart2Top = chart2Margin.top;

// Chart 3: Advanced Focus (e.g., Sankey/Parallel Coordinates flow) - Bottom half
let chart3Margin = {top: 40, right: 50, bottom: 60, left: 60},
    chart3Width = width - chart3Margin.left - chart3Margin.right - 40,
    chart3Height = (height * 0.42) - chart3Margin.top - chart3Margin.bottom;

let chart3Left = chart3Margin.left,
    chart3Top = (height * 0.52) + chart3Margin.top;

// Main SVG Container
const svg = d3.select("svg")
              .attr("width", width)
              .attr("height", height);

// Centralized data container
let globalTerrorData = [];

// Row converter to optimize memory usage by pruning unused columns
function rowConverter(d) {
    return {
        year: +d.iyear,
        month: +d.imonth,
        day: +d.iday,
        country: d.country_txt,
        region: d.region_txt,
        latitude: d.latitude ? +d.latitude : null,
        longitude: d.longitude ? +d.longitude : null,
        success: +d.success,
        suicide: +d.suicide,
        attackType: d.attacktype1_txt,
        targetType: d.targtype1_txt,
        weaponType: d.weaptype1_txt,
        groupName: d.gname,
        nkill: d.nkill ? +d.nkill : 0,
        nwound: d.nwound ? +d.nwound : 0,
        casualties: (d.nkill ? +d.nkill : 0) + (d.nwound ? +d.nwound : 0)
    };
}

// Ingest global terrorism dataset
d3.csv("data/globalterrorismdb_0718dist.csv", rowConverter).then(rawData => {
    // Save to shared asset variable
    globalTerrorData = rawData;

    console.log("Dataset successfully loaded!");
    console.log("Total Records Count:", globalTerrorData.length);
    console.log("First record preview:", globalTerrorData[0]);

    // Calculate sample metrics for console verification
    const minYear = d3.min(globalTerrorData, d => d.year);
    const maxYear = d3.max(globalTerrorData, d => d.year);
    const totalKill = d3.sum(globalTerrorData, d => d.nkill);
    console.log(`Year Range: ${minYear} - ${maxYear}`);
    console.log(`Total Fatalities: ${totalKill}`);

    // Initalize the environment and setup empty graphs
    initChart1();
    initChart2();
    initChart3();

}).catch(error => {
    console.error("Error loading the CSV file:", error);
});


// -------------------------------------------------------------
// Chart 1: Temporal Overview (Line / Area Chart Space)
// -------------------------------------------------------------
function initChart1() {
    const g1 = svg.append("g")
                  .attr("id", "chart-temporal")
                  .attr("transform", `translate(${chart1Left}, ${chart1Top})`);

    // Title
    g1.append("text")
      .attr("x", chart1Width / 2)
      .attr("y", -10)
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
      .text("Chart 1: Temporal Trends (Incidents & Casualties Over Time)");

    // X Axis Group & Label
    g1.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${chart1Height})`);

    g1.append("text")
      .attr("x", chart1Width / 2)
      .attr("y", chart1Height + 40)
      .attr("font-size", "12px")
      .attr("text-anchor", "middle")
      .text("Year");

    // Y Axis Group & Label
    g1.append("g")
      .attr("class", "y-axis");

    g1.append("text")
      .attr("x", -(chart1Height / 2))
      .attr("y", -45)
      .attr("font-size", "12px")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .text("Count");

    // Placeholder message for empty space
    g1.append("text")
      .attr("x", chart1Width / 2)
      .attr("y", chart1Height / 2)
      .attr("font-size", "14px")
      .attr("fill", "#888")
      .attr("text-anchor", "middle")
      .attr("font-style", "italic")
      .text("[ Chart Area 1 - Temporal Line/Area Graph Placeholder ]");
}


// -------------------------------------------------------------
// Chart 2: Categorical Focus (Bar / Pie Chart Space)
// -------------------------------------------------------------
function initChart2() {
    const g2 = svg.append("g")
                  .attr("id", "chart-categorical")
                  .attr("transform", `translate(${chart2Left}, ${chart2Top})`);

    // Title
    g2.append("text")
      .attr("x", chart2Width / 2)
      .attr("y", -10)
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
      .text("Chart 2: Weapon & Attack Modalities");

    // X Axis Group & Label
    g2.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${chart2Height})`);

    g2.append("text")
      .attr("x", chart2Width / 2)
      .attr("y", chart2Height + 40)
      .attr("font-size", "12px")
      .attr("text-anchor", "middle")
      .text("Category");

    // Y Axis Group & Label
    g2.append("g")
      .attr("class", "y-axis");

    g2.append("text")
      .attr("x", -(chart2Height / 2))
      .attr("y", -45)
      .attr("font-size", "12px")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .text("Incidents");

    // Placeholder message for empty space
    g2.append("text")
      .attr("x", chart2Width / 2)
      .attr("y", chart2Height / 2)
      .attr("font-size", "14px")
      .attr("fill", "#888")
      .attr("text-anchor", "middle")
      .attr("font-style", "italic")
      .text("[ Chart Area 2 - Categorical Graph Placeholder ]");
}


// -------------------------------------------------------------
// Chart 3: Advanced Focus (Sankey / Parallel Coordinates Space)
// -------------------------------------------------------------
function initChart3() {
    const g3 = svg.append("g")
                  .attr("id", "chart-advanced")
                  .attr("transform", `translate(${chart3Left}, ${chart3Top})`);

    // Title
    g3.append("text")
      .attr("x", chart3Width / 2)
      .attr("y", -15)
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
      .text("Chart 3: Advanced Multi-Dimensional Flow (Sankey / PCP)");

    // X Axis Group & Label
    g3.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${chart3Height})`);

    g3.append("text")
      .attr("x", chart3Width / 2)
      .attr("y", chart3Height + 40)
      .attr("font-size", "12px")
      .attr("text-anchor", "middle")
      .text("Dimensions");

    // Y Axis Group & Label
    g3.append("g")
      .attr("class", "y-axis");

    g3.append("text")
      .attr("x", -(chart3Height / 2))
      .attr("y", -45)
      .attr("font-size", "12px")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .text("Flow Value / Rate");

    // Placeholder message for empty space
    g3.append("text")
      .attr("x", chart3Width / 2)
      .attr("y", chart3Height / 2)
      .attr("font-size", "14px")
      .attr("fill", "#888")
      .attr("text-anchor", "middle")
      .attr("font-style", "italic")
      .text("[ Chart Area 3 - Advanced Flow/Sankey Graph Placeholder ]");
}