((window) => {
  // Years bar graphs graph object
  const BarGraph = {
    init(divId, data) {
    // TODO: show value on hover of each bar
    // TODO: label x axis
    const margin = {top: 10, right: 0, bottom: 16, left: 40};
    const width = 20 * data.length;
    const height = 120;

    const div = d3.select('#' + divId);
    div.selectAll('svg').remove();

    const svg = div
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const x = d3.scaleBand().rangeRound([0, width]).padding(0.2);
    const y = d3.scaleLinear().rangeRound([height, 0]);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    x.domain(data.map(function(d) { return d.name; }));
    y.domain([0, d3.max(data, function(d) { return d.count; })]);

    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y).ticks(data.length / 2))
      .append('text')
      .attr('transform', 'rotate(-90)');

    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('fill', '#aaa')
      .attr('x', function(d) { return x(d.name); })
      .attr('y', function(d) { return y(d.count); })
      .attr('width', x.bandwidth())
      .attr('height', function(d) { return height - y(d.count); });
    },
  };

  // Expose API globally.
  window.DS = Object.assign({}, window.DS || {}, {
    BarGraph
  });
})(window);