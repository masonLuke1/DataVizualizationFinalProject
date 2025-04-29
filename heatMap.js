class HeatMap {
    constructor(w, h, geoJsonPath, csvPath, con) {
        this.geoJsonPath = geoJsonPath;
        this.csvData = csvPath;
        this.con = con;

        this.size = {
            width: w,
            height: h,
            margin: con.margin,
            padding: con.margin / 10
        };

        this.colorScale = d3.scaleLinear()
            .domain([0, 600, 1200])
            .range(["green", "yellow", "red"]);

        this.initSvg();
        this.initProjection();
        this.render(this.csvData);
    }

    initSvg() {
        const container = this.con.root.append('div')
            .attr('id', 'HeatmapContainer')
            .style('width', `${this.size.width}px`)
            .style('height', `${this.size.height}px`);

        this.svg = container.append('svg')
            .attr('width', this.size.width)
            .attr('height', this.size.height);

        this.svg.append("text")
            .attr("x", this.size.width / 2)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .text("Price Range Heatmap of New York City");

        this.mapLayer = this.svg.append('g');
        this.dataLayer = this.svg.append('g');

        this.legendGroup = this.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${this.size.width - 150}, ${this.size.height - 50})`);
    }

    initProjection() {
        this.projection = d3.geoMercator()
            .center([-73.995242, 40.710610])
            .scale(60000)
            .translate([this.size.width / 2, this.size.height / 2]);
        this.path = d3.geoPath().projection(this.projection);
    }

    drawMap() {
        d3.json(this.geoJsonPath).then(nycData => {
            this.mapLayer.selectAll("path")
                .data(nycData.features)
                .enter()
                .append("path")
                .attr("d", this.path)
                .attr("fill", "gray")
                .attr("stroke", "black")
                .attr("stroke-width", 1);
        });
    }

    plotData(inputdata) {
        const parsedData = inputdata.map(d => ({
            lat: +d.lat,
            long: +d.long,
            price: +d.price.replace(/[^0-9.-]+/g, ""),
            neighbourhood_group: d["neighbourhood group"],
            room_type: d["room type"]
        })).filter(d => d.lat && d.long && d.price);

        parsedData.sort((a, b) => a.price - b.price);

        this.dataLayer.selectAll("circle")
            .data(parsedData)
            .enter()
            .append("circle")
            .attr("cx", d => this.projection([d.long, d.lat])[0])
            .attr("cy", d => this.projection([d.long, d.lat])[1])
            .attr("r", d => {
                if (d.price <= 600) return 4;
                if (d.price <= 1200) return 2;
                return 2;
            })
            .attr("fill", d => this.colorScale(d.price))
            .attr("opacity", 0.7)
            .on("mouseover", (event, d) => {
                const tooltip = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("position", "absolute")
                    .style("background", "white")
                    .style("border", "1px solid black")
                    .style("padding", "5px")
                    .style("pointer-events", "none")
                    .html(`
                        <strong>Price:</strong> $${d.price}<br>
                        <strong>Neighbourhood Group:</strong> ${d.neighbourhood_group}<br>
                        <strong>Room Type:</strong> ${d.room_type}<br>
                        <strong>Lat:</strong> ${d.lat}<br>
                        <strong>Long:</strong> ${d.long}
                    `);

                tooltip.style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY + 10}px`);
            })
            .on("mouseout", () => {
                d3.select(".tooltip").remove();
            });
    }

    render(inputdata) {
        this.drawMap();
        this.plotData(inputdata);

        // Draw the legend
        const defs = this.svg.append("defs");
        const gradient = defs.append("linearGradient")
            .attr("id", "price-gradient")
            .attr("x1", "0%")
            .attr("x2", "100%")
            .attr("y1", "0%")
            .attr("y2", "0%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "green");
        gradient.append("stop")
            .attr("offset", "50%")
            .attr("stop-color", "yellow");
        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "red");

        this.legendGroup.append("rect")
            .attr("width", 120)
            .attr("height", 15)
            .style("fill", "url(#price-gradient)");

        this.legendGroup.append("text")
            .attr("x", 0)
            .attr("y", 30)
            .style("font-size", "12px")
            .text("$0");

        this.legendGroup.append("text")
            .attr("x", 100)
            .attr("y", 30)
            .style("font-size", "12px")
            .text("$1200");

        this.legendGroup.append("text")
            .attr("x", 0)
            .attr("y", -10)
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("Price Range");
    }

    update(newData) {
        this.dataLayer.selectAll("circle").remove();
        this.plotData(newData);
    }
}
