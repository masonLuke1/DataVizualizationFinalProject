class Control {
    constructor(data) {
        const size = {
            width: 2300,
            height: 2000
        };

        this.root = d3.select('body').append('div')
            .attr('id', 'root')
            .style('width', `${size.width}px`)
            .style('height', `${size.height}px`)

        this.color = d3.scaleOrdinal(d3.schemeCategory10);
        this.margin = { top: 40, right: 40, bottom: 60, left: 60 };

        this.originalData = data;
        this.filteredData = data;

        this.Scatter = new Scatter(data, size.width/2 - 150, size.height/2, this);
        this.createCombinedFilters(data);
        this.Heatmap = new HeatMap(size.width/2 - 150, size.height/2, "new-york-city-boroughs.geojson", data, this);
        this.Barchart = new BarChart(data, size.width, size.height/2, this);
    }

    createCombinedFilters(data) {
        const corrections = {
            "manhatan": "Manhattan",
            "brookln": "Brooklyn",
            "": "Unknown"
        };
    
        data.forEach(d => {
            const group = d["neighbourhood group"]?.trim();
            if (corrections.hasOwnProperty(group)) {
                d["neighbourhood group"] = corrections[group];
            }
        });
    
        const filterContainer = this.root.append('div')
            .attr('id', 'filter-container')
            .style('border', '1px solid #ccc')
            .style('padding', '20px')
            .style('margin-bottom', '20px')
            .style('width', '300px')
            .style('height', '600px')

        const neighborhoodDiv = filterContainer.append('div')
            .attr('class', 'filter-section');
    
        neighborhoodDiv.append('h3')
            .text('Filter by Neighbourhood Group')
            .style('margin-bottom', '15px');
    
        const groups = Array.from(new Set(data.map(d => d["neighbourhood group"])))
            .filter(group => group && group !== "Unknown")
            .sort();
    
        groups.forEach(group => {
            const label = neighborhoodDiv.append('label')
                .style('display', 'flex')
                .style('align-items', 'center')
                .style('margin-bottom', '8px');
    
            label.append('input')
                .attr('type', 'checkbox')
                .attr('value', group)
                .attr('checked', true)
                .style('margin-right', '8px')
                .on('change', () => this.updateFilteredData());
    
            label.append('span').text(group);
        });
    
        const priceDiv = filterContainer.append('div')
            .attr('class', 'filter-section');
    
        priceDiv.append('h3')
            .text('Filter by Price Range')
            .style('margin-bottom', '15px');
    
        const priceControls = priceDiv.append('div')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '10px');
    
        priceControls.append('input')
            .attr('type', 'number')
            .attr('id', 'price-min')
            .attr('placeholder', 'Min')
            .attr('value', 0)
            .style('width', '80px')
            .style('padding', '5px')
            .on('change', () => this.updateFilteredData());
    
        priceControls.append('span').text('to');
    
        priceControls.append('input')
            .attr('type', 'number')
            .attr('id', 'price-max')
            .attr('placeholder', 'Max')
            .attr('value', 1200)
            .style('width', '80px')
            .style('padding', '5px')
            .on('change', () => this.updateFilteredData());
    
        const roomTypeDiv = filterContainer.append('div')
            .attr('class', 'filter-section');
    
        roomTypeDiv.append('h3')
            .text('Filter by Room Type')
            .style('margin-bottom', '15px');
    
        const roomTypes = ["Entire home/apt", "Private room", "Shared room"];
        
        roomTypes.forEach(type => {
            const label = roomTypeDiv.append('label')
                .style('display', 'flex')
                .style('align-items', 'center')
                .style('margin-bottom', '8px');
        
            label.append('input')
                .attr('type', 'checkbox')
                .attr('class', 'room-type-filter')
                .attr('value', type)
                .attr('checked', true)
                .style('margin-right', '8px')
                .on('change', () => this.updateFilteredData());
        
            label.append('span').text(type);
        });
    }

    updateFilteredData() {
        const selectedNeighborhoods = [];
        d3.selectAll('#filter-container input[type="checkbox"]').each(function () {
            if (this.checked) selectedNeighborhoods.push(this.value);
        });

        const selectedRoomTypes = [];
        d3.selectAll('.room-type-filter').each(function () {
            if (this.checked) selectedRoomTypes.push(this.value);
        });

        const minPrice = +d3.select('#price-min').property('value');
        const maxPrice = +d3.select('#price-max').property('value');

        this.filteredData = this.originalData.filter(d => {
            const price = +d.price.replace(/[^0-9.-]+/g, "");
            return selectedNeighborhoods.includes(d["neighbourhood group"]) && 
                   selectedRoomTypes.includes(d["room type"]) &&
                   price >= minPrice && price <= maxPrice;
        });

        this.Scatter.update(this.filteredData);
        this.Heatmap.update(this.filteredData);
        this.Barchart.update(this.filteredData); 
    }

}
