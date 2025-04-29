class Scatter {
    constructor(data, w, h, con) {
        this.data = data;
        this.w = w;
        this.h = h;
        this.con = con;
        this.arrDimension = con.arrDimension || ['review rate number', 'price'];
        this.size = {
            width: w,
            height: h,
            margin: con.margin,
            padding: con.margin / 10
        };

        this.svgContainer = con.root.append('div')
            .attr('id', 'ScatterPlot')
            .style('width', `${w}px`)
            .style('height', `${h}px`);

        this.svg = this.svgContainer
            .append('svg')
            .attr('width', w)
            .attr('height', h);

        this.tooltip = d3.select("body").append("div")
            .attr("class", "scatter-tooltip")
            .style("position", "absolute")
            .style("background", "white")
            .style("border", "1px solid #ddd")
            .style("border-radius", "5px")
            .style("padding", "10px")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("font-size", "12px")
            .style("box-shadow", "0 0 5px rgba(0,0,0,0.2)")
            .style("min-width", "180px");

        this.svg.append("text")
            .attr("x", this.size.width / 2)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .text("Scatter Plot of Price vs Airbnb Rating");

        this.render(this.data);
    }

    render(inputdata) {
        const { data, size, con } = this;
        const xVar = 'review rate number';
        const yVar = 'price';

        const filteredData = inputdata.map(d => {
            const cleanPrice = parseFloat(String(d['price']).replace(/[^0-9.]+/g, ''));
            const cleanReviewRate = parseFloat(String(d['review rate number']).replace(/[^0-9.]+/g, ''));
            const cleanReviewsPerMonth = parseFloat(String(d['reviews per month']).replace(/[^0-9.]+/g, ''));
            const cleanTotalReviews = parseFloat(String(d['number of reviews']).replace(/[^0-9.]+/g, ''));

            return {
                ...d,
                price: isNaN(cleanPrice) ? null : cleanPrice,
                ['review rate number']: isNaN(cleanReviewRate) ? null : cleanReviewRate,
                ['reviews per month']: isNaN(cleanReviewsPerMonth) ? 0 : cleanReviewsPerMonth,
                ['number of reviews']: isNaN(cleanTotalReviews) ? 0 : cleanTotalReviews
            };
        }).filter(d =>
            d.price !== null && d['review rate number'] !== null &&
            d.price > 0 && d['review rate number'] > 0
        );

        this.filteredData = filteredData;

        this.scaledX = {};
        this.scaledY = {};

        this.scaledX[xVar] = d3.scaleBand()
            .domain([1, 2, 3, 4, 5])
            .range([100, size.width - 100]);

        this.scaledY[yVar] = d3.scaleLinear()
            .domain(d3.extent(filteredData, d => +d[yVar]))
            .range([size.height - 100, 100]);

        this.svg.append('g')
            .attr('transform', `translate(0, ${size.height - 100})`)
            .call(d3.axisBottom(this.scaledX[xVar]))
            .selectAll('.tick text')
            .style('text-anchor', 'middle');

        this.svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", size.width / 2)
            .attr("y", size.height - 40)
            .text("Review Rate Number")
            .style("font-size", "14px")
            .style("font-weight", "bold");

        this.svg.append('g')
            .attr('transform', `translate(100, 0)`)
            .call(d3.axisLeft(this.scaledY[yVar]))
            .selectAll('.tick')
            .filter(function () {
                return d3.select(this).select('text').text() === '';
            })
            .remove();

        this.svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", `rotate(-90)`)
            .attr("x", -(size.height / 2))
            .attr("y", 40)
            .text("Price")
            .style("font-size", "15px")
            .style("font-weight", "bold");

        const points = filteredData.map(d => ({
            rate: d['review rate number'],
            price: d['price'],
            size: d['number of reviews'],
            color: d['reviews per month'],
            neighbourhood_group: d['neighbourhood group'],
            room_type: d['room type']
        }));

        const reviewExtent = d3.extent(points, d => +d.color);
        const colorScale = d3.scaleLinear()
            .domain(reviewExtent)
            .range(['#add8e6', '#00008b']);

        this.svg.selectAll('circle')
            .data(points)
            .enter()
            .append('circle')
            .attr('cx', d => this.scaledX[xVar](d.rate) + this.scaledX[xVar].bandwidth() / 2)
            .attr('cy', d => this.scaledY[yVar](d.price))
            .attr('r', d => Math.sqrt(d.size) * .5)
            .attr('fill', d => colorScale(d.color))
            .attr('opacity', 0.7)
            .on("mouseover", (event, d) => {
                d3.select(event.currentTarget)
                    .attr("stroke", "#000")
                    .attr("stroke-width", 2);
                
                this.tooltip.transition()
                    .duration(200)
                    .style("opacity", 1);
                
                this.tooltip.html(`
                    <strong>Price:</strong> $${d.price.toFixed(2)}<br>
                    <strong>Neighbourhood:</strong> ${d.neighbourhood_group || 'N/A'}<br>
                    <strong>Room Type:</strong> ${d.room_type || 'N/A'}<br>
                    <strong>Rating:</strong> ${d.rate}<br>
                    <strong>Total Reviews:</strong> ${d.size}<br>
                    <strong>Monthly Reviews:</strong> ${d.color.toFixed(2)}
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", (event) => {
                d3.select(event.currentTarget)
                    .attr("stroke", null);
                
                this.tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on("mousemove", (event) => {
                this.tooltip
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            });

        const sizeLegend = this.svg.append("g")
            .attr("class", "size-legend")
            .attr("transform", `translate(${size.width - 150}, 100)`);

        sizeLegend.append("text")
            .attr("x", 0)
            .attr("y", -20)
            .text("Size: Number of Reviews")
            .style("font-size", "12px");

        [50, 100, 200, 300, 400].forEach((val, i) => {
            const yOffset = 20 + i * 35;

            sizeLegend.append("circle")
                .attr("cx", 10)
                .attr("cy", yOffset)
                .attr("r", Math.sqrt(val) * 0.8)
                .attr("fill", "#ccc")
                .attr("opacity", 0.7);

            sizeLegend.append("text")
                .attr("x", 30)
                .attr("y", yOffset + 4)
                .text(`${val}`)
                .style("font-size", "11px");
        });

        // COLOR LEGEND
        const colorLegend = this.svg.append("g")
            .attr("class", "color-legend")
            .attr("transform", `translate(${size.width - 150}, 350)`);

        colorLegend.append("text")
            .attr("x", 0)
            .attr("y", -20)
            .text("Color: Monthly Reviews")
            .style("font-size", "12px");

        const gradientId = "colorLegendGradient";
        const defs = this.svg.append("defs");
        const gradient = defs.append("linearGradient")
            .attr("id", gradientId)
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", colorScale(reviewExtent[0]));

        gradient.append("stop")
            .attr("offset", "50%")
            .attr("stop-color", colorScale((reviewExtent[0] + reviewExtent[1]) / 2));

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", colorScale(reviewExtent[1]));

        colorLegend.append("rect")
            .attr("x", 10)
            .attr("y", 20)
            .attr("width", 120)
            .attr("height", 15)
            .style("fill", `url(#${gradientId})`);

        [reviewExtent[0], Math.floor((reviewExtent[0] + reviewExtent[1]) / 2), reviewExtent[1]].forEach((val, i) => {
            const xOffset = 10 + i * 60;
        
            colorLegend.append("line")
                .attr("x1", xOffset)
                .attr("y1", 35)
                .attr("x2", xOffset)
                .attr("y2", 40)
                .attr("stroke", "#000");
        
            colorLegend.append("text")
                .attr("x", xOffset)
                .attr("y", 55)
                .text(`${Math.round(val)}`)
                .style("font-size", "11px")
                .style("text-anchor", "middle");
        });
    }

    update(newData) {
        this.svg.selectAll("*").remove();
        this.tooltip.remove();
        
        this.tooltip = d3.select("body").append("div")
            .attr("class", "scatter-tooltip")
            .style("position", "absolute")
            .style("background", "white")
            .style("border", "1px solid #ddd")
            .style("border-radius", "5px")
            .style("padding", "10px")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("font-size", "12px")
            .style("box-shadow", "0 0 5px rgba(0,0,0,0.2)")
            .style("min-width", "180px");
        
        this.render(newData);
    }
}