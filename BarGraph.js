class BarChart {
  constructor(data, w, h, con) {
      this.con = con;
      this.size = {
          width: w - con.margin.left - con.margin.right,
          height: h - con.margin.left - con.margin.right,
          margin: con.margin,
          padding: con.margin / 10
      };

      this.svg = this.con.root.append('div')
        .attr("id", "BarChartContainer")
        .style("width", `${this.size.width + this.size.margin.left + this.size.margin.right}px`)
        .style("height", `${this.size.height + this.size.margin.top + this.size.margin.bottom}px`)
        .append("svg")
        .attr("width", this.size.width + this.size.margin.left + this.size.margin.right)
        .attr("height", this.size.height + this.size.margin.top + this.size.margin.bottom)
        .append("g")
        .attr("transform", `translate(${this.size.margin.left}, ${this.size.margin.top})`);

      this.svg.append("text")
        .attr("x", this.size.width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Bar Graph of AVG Price Over Different Neighbourhood Groups");

      // Filter and process data
      const validGroups = ["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island"];
      const cleaned = data.map(d => ({
          neighbourhood_group: d['neighbourhood group'],
          room_type: d['room type'],
          price: parseFloat(d['price'].replace(/[^0-9.]/g, ''))
      })).filter(d => d.price > 0 && validGroups.includes(d.neighbourhood_group));

      const roomTypes = ["Shared room", "Private room", "Entire home/apt"];
      const groups = Array.from(new Set(cleaned.map(d => d.neighbourhood_group)));

      const rollup = d3.rollups(
          cleaned,
          v => d3.mean(v, d => d.price),
          d => d.neighbourhood_group,
          d => d.room_type
      );

      const avgData = [];
      rollup.forEach(([group, values]) => {
          const mapRT = new Map(values);
          roomTypes.forEach(rt => {
              avgData.push({
                  group,
                  roomType: rt,
                  avgPrice: mapRT.has(rt) ? mapRT.get(rt) : 0
              });
          });
      });

      const x0 = d3.scaleBand()
          .domain(groups)
          .range([0, this.size.width])
          .paddingInner(0.2);

      const x1 = d3.scaleBand()
          .domain(roomTypes)
          .range([0, x0.bandwidth()])
          .padding(0.05);

      const y = d3.scaleLinear()
          .domain([0, d3.max(avgData, d => d.avgPrice) * 1.1])
          .nice()
          .range([this.size.height, 0]);

      const color = d3.scaleOrdinal()
          .domain(roomTypes)
          .range(["#6baed6", "#fd8d3c", "#74c476"]);

      this.svg.append("g")
          .attr("class", "axis")
          .call(d3.axisLeft(y));

      this.svg.append("g")
          .attr("class", "axis")
          .attr("transform", `translate(0,${this.size.height})`)
          .call(d3.axisBottom(x0));

      this.svg.append("text")
          .attr("x", -this.size.margin.left + 10)
          .attr("y", -10)
          .attr("text-anchor", "start")
          .text("Average Price ($)");

      this.svg.selectAll("g.group")
          .data(groups)
          .join("g")
              .attr("class", "group")
              .attr("transform", d => `translate(${x0(d)},0)`)
          .selectAll("rect")
          .data(g => avgData.filter(d => d.group === g))
          .join("rect")
              .attr("x", d => x1(d.roomType))
              .attr("y", d => y(d.avgPrice))
              .attr("width", x1.bandwidth())
              .attr("height", d => this.size.height - y(d.avgPrice))
              .attr("fill", d => color(d.roomType));

      const legend = this.svg.append("g")
          .attr("class", "legend")
          .attr("transform", `translate(${this.size.width - 100}, -20)`);

      roomTypes.forEach((rt, i) => {
          const item = legend.append("g")
              .attr("transform", `translate(0, ${i * 20})`);
          item.append("rect")
              .attr("width", 15)
              .attr("height", 15)
              .attr("fill", color(rt));
          item.append("text")
              .attr("x", 20)
              .attr("y", 12)
              .text(rt);
      });

  }
  update(newData) {
    d3.select("#BarChartContainer").remove();
    const currentWidth = this.size.width;
    const currentHeight = this.size.height;
    new BarChart(newData, 
        currentWidth + this.size.margin.left + this.size.margin.right,
        currentHeight + this.size.margin.top + this.size.margin.bottom,
        this.con
    );
}
}