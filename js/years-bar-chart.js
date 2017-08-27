function initBarChart(divId, data) {
  var marginLeft = 40,
      marginBottom = 20,
      width = 200 - marginLeft,
      height = 200 * 0.6 - marginBottom;

  var div = d3.select('#' + divId);
  div.selectAll('svg').remove()

  var svg = div
    .append('svg')
    .attr('width', width + marginLeft)
    .attr('height', height + marginBottom);

  var x = d3.scaleBand().rangeRound([0, width]).padding(0.2),
      y = d3.scaleLinear().rangeRound([height, 0]);

  var g = svg
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
    .call(d3.axisLeft(y).ticks(5))
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
