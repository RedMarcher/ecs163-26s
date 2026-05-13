// Load info from HTML imports
const width = window.innerWidth;
const height = window.innerHeight;
const svg = d3.select("#main-svg");

// Define display areas
const mapArea = { x: 0, y: 0, w: width * 0.6, h: height * 0.5 };
const pieArea = { x: width * 0.6, y: 0, w: width * 0.4, h: height * 0.5 };
const sankeyArea = { x: 50, y: height * 0.55, w: width - 100, h: height * 0.4 };

// Code for tooltips
const tooltip = d3.select("body").append("div").attr("class", "tooltip");
const formatComma = d3.format(",");

// Data processing function
function dataProcessor(d) {
    const casualties = (d.nkill ? +d.nkill : 0) + (d.nwound ? +d.nwound : 0);
    return {
        success: +d.success === 1 ? "Successful" : "Failed",
        attackType: d.attacktype1_txt || "Unknown",
        region: d.region_txt || "Unknown",
        nkill: d.nkill ? +d.nkill : 0,
        latitude: d.latitude ? +d.latitude : null,
        longitude: d.longitude ? +d.longitude : null,
        severity: casualties > 10 ? "High Casualty" : "Low/No Casualty"
    };
}

// Run data processing function and pass to functions
Promise.all([
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
    d3.csv("data/globalterrorismdb_0718dist.csv", dataProcessor)
]).then(([worldData, rawData]) => {
    drawMap(worldData, rawData);
    drawSankey(rawData);
    drawPieChart(rawData);
});

// Chart 1: World map of all attack locations
function drawMap(world, data) {
    const g = svg.append("g").attr("transform", `translate(${mapArea.x}, ${mapArea.y + 40})`);

    const projection = d3.geoNaturalEarth1()
        .scale(mapArea.w / 5.5)
        .translate([mapArea.w / 2, mapArea.h / 2]);

    const path = d3.geoPath().projection(projection);

    // Map Background
    g.selectAll(".country")
        .data(topojson.feature(world, world.objects.countries).features)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", "darkslategray")
        .attr("stroke", "gray");

    // Attack Points (Sampled for performance)
    g.selectAll("circle")
        .data(data.filter(d => d.latitude && d.longitude))
        .enter().append("circle")
        .attr("cx", d => projection([d.longitude, d.latitude])[0])
        .attr("cy", d => projection([d.longitude, d.latitude])[1])
        .attr("r", 1.5)
        .attr("fill", "tomato")
        .attr("opacity", 0.4);

    g.append("text").attr("class", "chart-title")
        .attr("x", mapArea.w / 2).attr("y", 10).text("Global Incident Hotspots");
}

// Chart 2: Pie chart showing regional deaths
function drawPieChart(data) {
    const radius = Math.min(pieArea.w, pieArea.h) / 2.5;
    const g = svg.append("g")
        .attr("transform", `translate(${pieArea.x + pieArea.w / 3}, ${pieArea.y + pieArea.h / 2 + 20})`);

    const aggregated = d3.rollups(data, v => d3.sum(v, d => d.nkill), d => d.region)
        .sort((a, b) => b[1] - a[1]);

    const pie = d3.pie().value(d => d[1]);
    const arc = d3.arc().innerRadius(radius * 0.5).outerRadius(radius);
    // Exactly 12 named CSS colors for the 12 regions in the dataset
    const customColors = [
        "crimson",
        "darkorange",
        "gold",
        "forestgreen",
        "teal",
        "dodgerblue",
        "mediumpurple",
        "hotpink",
        "sienna",
        "darkgray",
        "mediumaquamarine",
        "khaki"
    ];
    const color = d3.scaleOrdinal(customColors);

    const arcs = g.selectAll(".arc")
        .data(pie(aggregated))
        .enter().append("g");

    arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data[0]))
        .attr("stroke", "black")
        .style("stroke-width", "2px")
        .style("cursor", "pointer")

        // Used to define tooltip events
        .on("mouseover", function (event, d) {
            d3.select(this).style("opacity", 0.8);
            tooltip.style("visibility", "visible")
                .html(`<strong>Region:</strong> ${d.data[0]}<br/>
                          <strong>Total Fatalities:</strong> ${formatComma(d.data[1])}`);
        })
        .on("mousemove", function (event) {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function () {
            d3.select(this).style("opacity", 1);
            tooltip.style("visibility", "hidden");
        });

    // Legend
    const legend = g.append("g").attr("transform", `translate(${radius + 40}, -${radius})`);
    aggregated.forEach((d, i) => {
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 18})`);

        legendRow.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", color(d[0]));

        legendRow.append("text")
            .attr("x", 20)
            .attr("y", 10)
            .text(`${d[0]} (${formatComma(d[1])})`)
            .style("font-size", "11px")
            .attr("fill", "lightgray");
    });

    g.append("text")
        .attr("class", "chart-title")
        .attr("y", -radius - 25)
        .text("Fatalities by Region");
}

// Chart 3: Sankey chart showing progression of attacks
function drawSankey(data) {
    const g = svg.append("g").attr("transform", `translate(${sankeyArea.x}, ${sankeyArea.y})`);

    // Prepare Sankey data by aggregating (crucial for clean lines)
    const sample = data.slice(0, 2000);
    let links = [];

    // Create links: Success -> AttackType
    const flow1 = d3.rollups(sample, v => v.length, d => d.success, d => d.attackType);
    flow1.forEach(([src, targets]) => {
        targets.forEach(([tgt, val]) => {
            links.push({ source: src, target: tgt, value: val });
        });
    });

    // Create links: AttackType -> Severity
    const flow2 = d3.rollups(sample, v => v.length, d => d.attackType, d => d.severity);
    flow2.forEach(([src, targets]) => {
        targets.forEach(([tgt, val]) => {
            links.push({ source: src, target: tgt, value: val });
        });
    });

    // Generate unique nodes
    const nodes = Array.from(new Set(links.flatMap(d => [d.source, d.target])), name => ({ name }));
    const nodeMap = new Map(nodes.map((d, i) => [d.name, i]));

    const formattedLinks = links.map(d => ({
        source: nodeMap.get(d.source),
        target: nodeMap.get(d.target),
        value: d.value
    }));

    const sankey = d3.sankey()
        .nodeWidth(20)
        .nodePadding(12)
        .extent([[0, 20], [sankeyArea.w, sankeyArea.h - 20]]);

    const graph = sankey({
        nodes: nodes.map(d => Object.assign({}, d)),
        links: formattedLinks.map(d => Object.assign({}, d))
    });

    // Draw Links
    g.append("g").attr("class", "links")
        .selectAll("path").data(graph.links).enter().append("path")
        .attr("class", "link")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke-width", d => Math.max(1, d.width));

    // Draw Nodes
    const node = g.append("g").attr("class", "nodes")
        .selectAll("g").data(graph.nodes).enter().append("g");

    node.append("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", d => d.x0 < width / 2 ? "steelblue" : "navy");

    node.append("text")
        .attr("x", d => d.x0 < sankeyArea.w / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", d => (d.y1 + d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < sankeyArea.w / 2 ? "start" : "end")
        .text(d => d.name);

    g.append("text").attr("class", "chart-title").attr("x", sankeyArea.w / 2).attr("y", 0)
        .text("Attack Lifecycle: Outcome → Method → Severity");
}