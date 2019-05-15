((window) => {
  const margin = { top: 10, right: 0, bottom: 20, left: 40 };

  const tooltipBottomMargin = 2;
  const tooltip = d3.select('#data .bar-tooltip');

  const barWidth = 23;

  function showTooltip(x, y, w, name) {
    const text = document.querySelector('#data .bar-tooltip');

    tooltip.html(name);

    const textWidth = tooltip.node().clientWidth;
    const left = x + (w / 2 - textWidth/2);
    const top = y

    tooltip.classed('__hidden', false)
           .attr('style', `left:${left}px; top:${top}px`)
  }

  // Years bar graphs graph object
  const BarGraph = {
    init(divId, data) {
      const offsetXFromParent = document.getElementById(divId).offsetLeft;
      const width = barWidth * data.length;
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
        .enter()
        .append('rect')
        .attr('x', function(d) { return x(d.name); })
        .attr('y', function(d) { return y(d.count); })
        .attr('width', x.rangeBand())
        .attr('height', function(d) { return height - y(d.count); })
        .on('mousemove', function(d) {
          const value = d.count;
          const xTip = margin.left + x(d.name) + offsetXFromParent;
          const yTip = margin.top + y(d.count) - tooltipBottomMargin;

          showTooltip(xTip, yTip, x.rangeBand(), value);
        })
        .on('mouseleave', function() {
          tooltip.classed('__hidden', true);
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
    BarGraph
  });
})(window);
