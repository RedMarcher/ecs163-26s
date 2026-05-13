// --- 1. Setup ---
const width = window.innerWidth;
const height = window.innerHeight;

// Select SVG and force a background color so we can see it
const svg = d3.select("#main-svg")
              .attr("width", width)
              .attr("height", height)
              .style("background-color", "#f8f9fa"); 

// Layout Variables
let chart1Margin = {top: 50, right: 20, bottom: 20, left: 20},
    chart1Width = (width * 0.45),
    chart1Height = (height * 0.45);

let chart2Margin = {top: 50, right: 20, bottom: 20, left: 20},
    chart2Width = (width * 0.45),
    chart2Height = (height * 0.45);

let chart3Width = width - 100,
    chart3Height = (height * 0.4);

// --- 2. Row Converter ---
function rowConverter(d) {
    return {
        success: +d.success === 1,
        attackType: d.attacktype1_txt || "Unknown",
        region: d.region_txt || "Unknown",
        nkill: d.nkill ? +d.nkill : 0,
        latitude: d.latitude ? +d.latitude : null,
        longitude: d.longitude ? +d.longitude : null
    };
}

// --- 3. Load Data ---
Promise.all([
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
    d3.csv("data/globalterrorismdb_0718dist.csv", rowConverter)
]).then(([worldData, rawData]) => {
    console.log("Check 1: Data arrays ready.");
    
    // Draw a test rectangle to see if the SVG is even working
    svg.append("rect")
       .attr("width", 50)
       .attr("height", 50)
       .attr("fill", "green");
    console.log("Check 2: Green test square should be in top-left.");

    drawMap(worldData, rawData);
    drawPieChart(rawData);
    drawSankey(rawData);

}).catch(err => console.error("Load Error:", err));

// --- 4. Drawing Functions ---

function drawMap(world, data) {
    const g = svg.append("g").attr("transform", `translate(50, 50)`);
    
    const projection = d3.geoMercator() // Simpler projection for debugging
        .scale(chart1Width / 6)
        .translate([chart1Width / 2, chart1Height / 2]);

    const path = d3.geoPath().projection(projection);

    g.append("text").text("Map Loading...").attr("y", -10);

    g.selectAll("path")
        .data(topojson.feature(world, world.objects.countries).features)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", "#ddd")
        .attr("stroke", "#fff");

    const points = data.filter(d => d.latitude && d.longitude).slice(0, 1000);
    console.log(`Check 3: Map has ${points.length} valid GPS points.`);

    g.selectAll("circle")
        .data(points)
        .enter().append("circle")
        .attr("cx", d => projection([d.longitude, d.latitude])[0])
        .attr("cy", d => projection([d.longitude, d.latitude])[1])
        .attr("r", 2)
        .attr("fill", "red");
}

function drawPieChart(data) {
    const centerX = width * 0.75;
    const centerY = height * 0.25;
    const g = svg.append("g").attr("transform", `translate(${centerX}, ${centerY})`);

    const rolled = d3.rollups(data, v => d3.sum(v, d => d.nkill), d => d.region);
    console.log("Check 4: Pie data keys:", rolled.map(d => d[0]));

    const pie = d3.pie().value(d => d[1]);
    const arc = d3.arc().innerRadius(0).outerRadius(100);
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    g.selectAll("path")
        .data(pie(rolled))
        .enter().append("path")
        .attr("d", arc)
        .attr("fill", (d, i) => color(i));
    
    g.append("text").text("Regional Fatalities").attr("text-anchor", "middle").attr("y", -120);
}

function drawSankey(data) {
    const g = svg.append("g").attr("transform", `translate(50, ${height * 0.6})`);
    
    const sample = data.slice(0, 500);
    const nodes = Array.from(new Set(sample.flatMap(d => [d.success ? "Success" : "Failed", d.attackType])), name => ({name}));
    const nodeMap = new Map(nodes.map((d, i) => [d.name, i]));
    
    const links = d3.rollups(sample, v => v.length, d => (d.success ? "Success" : "Failed"), d => d.attackType)
        .flatMap(([src, targets]) => targets.map(([tgt, count]) => ({
            source: nodeMap.get(src),
            target: nodeMap.get(tgt),
            value: count
        })));

    const sankey = d3.sankey()
        .nodeWidth(20)
        .nodePadding(10)
        .extent([[0, 0], [chart3Width, chart3Height]]);

    const graph = sankey({
        nodes: nodes.map(d => Object.assign({}, d)),
        links: links.map(d => Object.assign({}, d))
    });

    console.log("Check 5: Sankey Graph generated.");

    g.append("g")
        .selectAll("path")
        .data(graph.links)
        .enter().append("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", "#000")
        .attr("stroke-opacity", 0.2)
        .attr("fill", "none")
        .attr("stroke-width", d => d.width);

    g.append("g")
        .selectAll("rect")
        .data(graph.nodes)
        .enter().append("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", "blue");
}