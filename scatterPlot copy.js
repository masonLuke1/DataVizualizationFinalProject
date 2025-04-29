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

        this.render(this.data);
    }

    render(inputdata) {
        const { data, size, con } = this;
        const xVar = 'review rate number';
        const yVar = 'price';

        // Clean and filter data
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

        // Prepare container
        // this.svg = con.root.append('div')
        //     .attr('id', 'ScatterPlot')
        //     .style('width', `${size.width}px`)
        //     .style('height', `${size.height}px`)
        //     .append('svg')
        //         .attr('width', size.width)
        //         .attr('height', size.height)
        //     .append('g');

        this.scaledX = {};
        this.scaledY = {};

        // Set up scales
        this.scaledX[xVar] = d3.scaleBand()
            .domain([1, 2, 3, 4, 5])
            .range([100, size.width - 100]);

        this.scaledY[yVar] = d3.scaleLinear()
            .domain(d3.extent(filteredData, d => +d[yVar]))
            .range([size.height - 100, 100]);

        // Draw axes
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
            color: d['reviews per month']
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
            .attr('opacity', 0.7);

        // Size Legend
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

        // Add title
        colorLegend.append("text")
            .attr("x", 0)
            .attr("y", -20)
            .text("Color: Monthly Reviews")
            .style("font-size", "12px");

        // Create gradient definition
        const gradientId = "colorLegendGradient";
        const defs = this.svg.append("defs");
        const gradient = defs.append("linearGradient")
            .attr("id", gradientId)
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        // Add gradient stops
        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", colorScale(reviewExtent[0]));

        gradient.append("stop")
            .attr("offset", "50%")
            .attr("stop-color", colorScale((reviewExtent[0] + reviewExtent[1]) / 2));

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", colorScale(reviewExtent[1]));

        // Add gradient rectangle
        colorLegend.append("rect")
        .attr("x", 10)
        .attr("y", 20)
        .attr("width", 120)
        .attr("height", 15)
        .style("fill", `url(#${gradientId})`);

        // Add scale markers and labels
        [reviewExtent[0], Math.floor((reviewExtent[0] + reviewExtent[1]) / 2), reviewExtent[1]].forEach((val, i) => {
            const xOffset = 10 + i * 60;
    
        // Add tick marks
        colorLegend.append("line")
            .attr("x1", xOffset)
            .attr("y1", 35)
            .attr("x2", xOffset)
            .attr("y2", 40)
            .attr("stroke", "#000");
    
        // Add labels
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
        //this.svg.selectAll('g').remove();
        //d3.select('#ScatterPlot').remove();
        //scatterObj = new Scatter(newData, wid, heig, con);
        this.render(newData); // Now we call render explicitly
    }
}