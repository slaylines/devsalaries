((window) => {
  const div = d3.selectAll('#whisker-graph');

  function showTooltip(box, name, stats) {
    div.selectAll('.tooltip-back')
      .style('display', 'block');

    div.selectAll('.tooltip-text-title')
      .text(`${name} year${name[0] === '<' || name[0] === '1' ? '' : 's'}`);

    div.selectAll('.tooltip-text-min')
      .text(`min = ${stats.min.toFixed(2)};`)

    div.selectAll('.tooltip-text-mins')
      .text(`5% = ${stats.quantiles[5].toFixed(2)}; 25% = ${stats.quantiles[25].toFixed(2)};`)

    div.selectAll('.tooltip-text-median')
      .text(`50% = ${stats.quantiles[50].toFixed(2)};`)

    div.selectAll('.tooltip-text-maxs')
      .text(`75% = ${stats.quantiles[75].toFixed(2)}; 95% = ${stats.quantiles[95].toFixed(2)};`)

    div.selectAll('.tooltip-text-max')
      .text(`max = ${stats.max.toFixed(2)};`)

    div.selectAll('.tooltip')
      .style('display', 'block');

    box.selectAll('rect')
      .style('fill', '#d1ccf3');
  }

  function hideTooltip(box) {
    div.selectAll('.tooltip-back')
      .style('display', 'none');

    div.selectAll('.tooltip')
      .style('display', 'none');

    box.selectAll('rect')
      .style('fill', 'none');
  }

  // Salary whisker graph graph object
  const WhiskerGraph = {
    init(years, prop, stats) {
      const margin = { top: 10, right: 0, bottom: 20, left: 40 };
      const width = 480;
      const height = width * 0.6;

      const mainColor = '#333';
      const accentColor = '#c85000';
      const radius = 2;
      const lineWidth = 5;
      const textHeight = 10;

      div.selectAll('svg').remove();

      const svg = div
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

      const g = svg
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const size = stats.max - stats.min;

      const x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .2)
        .domain(years.map(function(d) { return d.name; }));
      const y = d3.scale.linear()
        .range([height, 0])
        .domain([stats.min - size * 0.1, stats.max + size * 0.1]);

      const maxBoxWidth = x.rangeBand();
      const boxWidth = 18;
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
          const data = d.stats[prop];
          if (!data) { return; }

          const box = d3.select(this);
          const cx = shift + x(d.name) + boxWidth / 2;

          const max = y(data.min);
          const quant95 = y(data.quantiles[5]);
          const quant75 = y(data.quantiles[25]);
          const quant50 = y(data.quantiles[50]);
          const quant25 = y(data.quantiles[75]);
          const quant5 = y(data.quantiles[95]);
          const min = y(data.max);

          // box - quantiles from 25 to 75
          box.append('rect')
            .style('fill', 'none')
            .style('stroke', mainColor)
            .attr('x', cx - boxWidth / 2)
            .attr('y', quant25)
            .attr('width', boxWidth)
            .attr('height', quant75 - quant25);

          // horizontal median line
          box.append('line')
            .style('stroke', accentColor)
            .style('stroke-width', 2)
            .attr('x1', cx - boxWidth / 2)
            .attr('y1', quant50)
            .attr('x2', cx + boxWidth / 2)
            .attr('y2', quant50);

          // lines between 25 and 75 quantiles and 5 and 95 quantiles with points
          if (quant5 < quant25) {
            box.append('line')
              .style('stroke', mainColor)
              .attr('x1', cx)
              .attr('y1', quant5)
              .attr('x2', cx)
              .attr('y2', quant25);

            box.append('line')
              .style('stroke', mainColor)
              .attr('x1', cx - lineWidth)
              .attr('y1', quant5)
              .attr('x2', cx + lineWidth)
              .attr('y2', quant5);
          }
          if (quant95 > quant75) {
            box.append('line')
              .style('stroke', mainColor)
              .attr('x1', cx)
              .attr('y1', quant95)
              .attr('x2', cx)
              .attr('y2', quant75);

            box.append('line')
              .style('stroke', mainColor)
              .attr('x1', cx - lineWidth)
              .attr('y1', quant95)
              .attr('x2', cx + lineWidth)
              .attr('y2', quant95);
          }

          // min and max - as circles
          if (min < quant5) {
            box.append('circle')
              .style('fill', 'none')
              .style('stroke', mainColor)
              .attr('cx', cx)
              .attr('cy', min)
              .attr('r', radius);
          }
          if (max > quant95) {
            box.append('circle')
              .style('fill', 'none')
              .style('stroke', mainColor)
              .attr('cx', cx)
              .attr('cy', max)
              .attr('r', radius);
          }

          box.on('mousemove', function(d) {
            showTooltip(box, d.name, data);
          })
          .on('mouseleave', function() {
            hideTooltip(box);
          });
        });

      // add two axes
      g.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis);

      g.append('g')
        .attr('class', 'axis')
        .call(yAxis)
        .append('text')
        .attr('transform', 'rotate(-90)');

      // add background for tooltip
      const shiftT = 6;
      g.append('rect')
        .attr('class', 'tooltip-back')
        .style('display', 'none')
        .attr('x', shiftT * 2)
        .attr('y', 0)
        .attr('width', 220)
        .attr('height', 108);

      // add tooltip text
      const tooltip = g
        .append('g')
        .attr('class', 'tooltip')
        .style('display', 'none');
      const x0 = shiftT * 3;
      const y0 = shiftT + textHeight;

      tooltip.append('text')
        .attr('class', 'tooltip-text-title')
        .attr('x', x0)
        .attr('y', y0);

      const tooltipStats = tooltip
        .append('text')
        .attr('x', x0)
        .attr('y', y0 * 2 + 2)

      tooltipStats
        .append('tspan')
        .attr('class', 'tooltip-text-min')
        .attr('x', x0);
      tooltipStats
        .append('tspan')
        .attr('class', 'tooltip-text-mins')
        .attr('x', x0)
        .attr('dy', textHeight + shiftT);
      tooltipStats
        .append('tspan')
        .attr('class', 'tooltip-text-median')
        .attr('x', x0)
        .attr('dy', textHeight + shiftT);
      tooltipStats
        .append('tspan')
        .attr('class', 'tooltip-text-maxs')
        .attr('x', x0)
        .attr('dy', textHeight + shiftT);
      tooltipStats
        .append('tspan')
        .attr('class', 'tooltip-text-max')
        .attr('x', x0)
        .attr('dy', textHeight + shiftT);
    },
  };

  // Expose API globally.
  window.DS = Object.assign({}, window.DS || {}, {
    WhiskerGraph
  });
})(window);
