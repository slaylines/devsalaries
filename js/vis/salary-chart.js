((window) => {
  // Salary whisker graph graph object
  const WhiskerGraph = {
    init(years, data) {
      const margin = {top: 10, right: 0, bottom: 20, left: 40};
      const width = 380;
      const height = width * 0.6;

      const mainColor = '#333';
      const accentColor = '#c85000';
      const radius = 2;
      const lineWidth = 3;

      const div = d3.selectAll('#whisker-graph');
      div.selectAll('svg').remove();

      const svg = div
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

      const g = svg
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const size = data.max - data.min;

      const x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .2)
        .domain(years.map(function(d) { return d.name; }));
      const y = d3.scale.linear()
        .range([height, 0])
        .domain([data.min - size * 0.1, data.max + size * 0.1]);

      const maxBoxWidth = x.rangeBand();
      const boxWidth = 10;
      const shift = (maxBoxWidth - boxWidth) / 2;

      const xAxis = d3.svg.axis()
        .scale(x)
        .orient('bottom');

      const yAxis = d3.svg.axis()
        .scale(y)
        .orient('left')
        .ticks(10)
        .tickFormat((d) => d / 1000);

      g.selectAll('#whisker .box')
        .data(years)
        .enter()
        .append('g')
        .each(function(d) {
          const box = d3.select(this);
          const cx = x(d.name) + boxWidth / 2 + shift;

          const quant5 = y(data.quantiles[5]);
          const quant25 = y(data.quantiles[25]);
          const quant50 = y(data.quantiles[50]);
          const quant75 = y(data.quantiles[75]);
          const quant95 = y(data.quantiles[95]);

          // min and max - as circles
          [data.min, data.max].forEach((value) => {
            g.append('circle')
              .style('fill', 'none')
              .style('stroke', mainColor)
              .attr('cx', cx)
              .attr('cy', y(value))
              .attr('r', radius);
          });

          // box - quantiles from 25 to 75
          g.append('rect')
            .style('fill', 'none')
            .style('stroke', mainColor)
            .attr('x', cx - boxWidth / 2)
            .attr('y', quant75)
            .attr('width', boxWidth)
            .attr('height', quant25 - quant75);

          // lines between 25 and 75 quantiles and 5 and 95 quantiles
          g.append('line')
            .style('stroke', mainColor)
            .attr('x1', cx)
            .attr('y1', quant5)
            .attr('x2', cx)
            .attr('y2', quant25);

          g.append('line')
            .style('stroke', mainColor)
            .attr('x1', cx)
            .attr('y1', quant95)
            .attr('x2', cx)
            .attr('y2', quant75);

          // horizontal lines on 5 and 95 quantiles
          g.append('line')
            .style('stroke', mainColor)
            .attr('x1', cx - lineWidth)
            .attr('y1', quant5)
            .attr('x2', cx + lineWidth)
            .attr('y2', quant5);

          g.append('line')
            .style('stroke', mainColor)
            .attr('x1', cx - lineWidth)
            .attr('y1', quant95)
            .attr('x2', cx + lineWidth)
            .attr('y2', quant95);

          // horizontal median line
          g.append('line')
            .style('stroke', accentColor)
            .style('stroke-width', 2)
            .attr('x1', cx - boxWidth / 2)
            .attr('y1', quant50)
            .attr('x2', cx + boxWidth / 2)
            .attr('y2', quant50);

        });

      g.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis);

      g.append('g')
        .attr('class', 'axis')
        .call(yAxis)
        .append('text')
        .attr('transform', 'rotate(-90)');
    },
  };

  // Expose API globally.
  window.DS = Object.assign({}, window.DS || {}, {
    WhiskerGraph
  });
})(window);
