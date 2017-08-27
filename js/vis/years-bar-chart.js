function initBarChart(divId, data) {
  // TODO: show value on hover of each bar
  const marginLeft = 40,
      marginBottom = 20,
      width = 240 - marginLeft,
      height = 240 * 0.6 - marginBottom;

  const div = d3.select('#' + divId);
  div.selectAll('svg').remove()

  const svg = div
    .append('svg')
    .attr('width', width + marginLeft)
    .attr('height', height + marginBottom);

  const x = d3.scaleBand().rangeRound([0, width]).padding(0.2),
      y = d3.scaleLinear().rangeRound([height, 0]);

  const g = svg
    .append('g')
    .attr('transform', 'translate(' + marginLeft + ',0)');

  x.domain(data.map(function(d) { return d.name; }));
  y.domain([0, d3.max(data, function(d) { return d.count; })]);

  g.append('g')
    .attr('class', 'axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.axisBottom(x));

  g.append('g')
    .attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(data.length / 2))
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 6)
    .attr('dy', '0.71em')
    .attr('text-anchor', 'end');

  g.selectAll('.bar')
    .data(data)
    .enter().append('rect')
    .attr('fill', '#999')
    .attr('x', function(d) { return x(d.name); })
    .attr('y', function(d) { return y(d.count); })
    .attr('width', x.bandwidth())
    .attr('height', function(d) { return height - y(d.count); });
};
