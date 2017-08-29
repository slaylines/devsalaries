((window) => {
  // Years bar graphs graph object
  const BarGraph = {
    init(divId, data) {
      // TODO: show value on hover of each bar
      const margin = {top: 10, right: 0, bottom: 20, left: 40};
      const width = 18 * data.length;
      const height = 130;

      const div = d3.select('#' + divId);
      div.selectAll('svg').remove();

      const svg = div
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

      const g = svg
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .2)
        .domain(data.map(function(d) { return d.name; }));
      const y = d3.scale.linear()
        .range([height, 0])
        .domain([0, d3.max(data, function(d) { return d.count; })]);

      const xAxis = d3.svg.axis()
        .scale(x)
        .orient('bottom');

      const yAxis = d3.svg.axis()
        .scale(y)
        .orient('left')
        .ticks(5);

      g.selectAll('.bar')
        .data(data)
        .enter().append('rect')
        .attr('fill', '#aaa')
        .attr('x', function(d) { return x(d.name); })
        .attr('y', function(d) { return y(d.count); })
        .attr('width', x.rangeBand())
        .attr('height', function(d) { return height - y(d.count); });

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
    BarGraph
  });
})(window);