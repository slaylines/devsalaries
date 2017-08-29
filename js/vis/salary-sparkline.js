((window) => {
  // Sparkline graph object
  const Sparkline = {
    init(divId, mainSalary, salary) {
      const width = 300;
      const height = 38;
      const padding = 11;
      const top = height / 2;
      const barHeight = 5.5;
      const radius = 3;

      const mainColor = '#333',
          lineColor = '#999',
          accentColor = '#c85000';

      const fontFamily = 'sans-serif';
      const fontSize = '12px';

      //calculate positions
      const minValue = Math.min(mainSalary.min, salary.min);
      const maxValue = Math.max(mainSalary.max, salary.max);

      const min = padding + width * (mainSalary.min - minValue) / (maxValue - minValue);
      const max = padding + width * (mainSalary.max - minValue) / (maxValue - minValue);
      const minQ = padding + width * (mainSalary.quantiles[25] - minValue) / (maxValue - minValue);
      const median = padding + width * (mainSalary.quantiles[50] - minValue) / (maxValue - minValue);
      const maxQ = padding + width * (mainSalary.quantiles[75] - minValue) / (maxValue - minValue);

      const div = d3.select('#' + divId);
      div.selectAll('svg').remove();

      const svg = div
        .append('svg')
        .attr('width', width + padding * 2)
        .attr('height', height);

      const g = svg.append('g');

      // add main line
      g.append('line')
        .style('stroke', lineColor)
        .attr('x1', min)
        .attr('y1', top)
        .attr('x2', minQ)
        .attr('y2', top);

      g.append('line')
        .style('stroke', lineColor)
        .attr('x1', maxQ)
        .attr('y1', top)
        .attr('x2', max)
        .attr('y2', top);

      // add min and max points on line
      [min, max].forEach((value) => {
        g.append('circle')
          .style('fill', mainColor)
          .attr('cx', value)
          .attr('cy', top)
          .attr('r', radius);
      });

      // add quantile lines
      [minQ, median, maxQ].forEach((value) => {
        const isMedian = value === median;
        g.append('line')
          .style('stroke', isMedian ? accentColor : mainColor)
          .style('stroke-width', isMedian ? 2 : 1)
          .attr('x1', value)
          .attr('y1', top - barHeight)
          .attr('x2', value)
          .attr('y2', top + barHeight);
      });

      // add additional lines
      [-barHeight, barHeight].forEach((h) => {
        g.append('line')
          .style('stroke', lineColor)
          .attr('x1', minQ)
          .attr('y1', top + h)
          .attr('x2', maxQ)
          .attr('y2', top + h);
      });

      // add text values - shift by half of width
      const medianText = g.append('text')
        .text(mainSalary.quantiles[50].toFixed(0))
        .attr('font-family', fontFamily)
        .attr('font-size', fontSize)
        .attr('fill', accentColor);
      let textWidth = medianText.node().getComputedTextLength();
      let textX = median - textWidth / 2;
      if (textX < 0) { textX = 0; }
      if (textX + textWidth > width + padding * 2) { textX = width + padding * 2; }
      medianText
        .attr('x', textX)
        .attr('y', 10);

      const minText = g.append('text')
        .text(mainSalary.min.toFixed(0))
        .attr('font-family', fontFamily)
        .attr('font-size', fontSize)
        .attr('fill', mainColor);
      textWidth = minText.node().getComputedTextLength();
      minText
        .attr('x', Math.max(min - textWidth / 2, 0))
        .attr('y', height - 1);

      const maxText = g.append('text')
        .text(mainSalary.max.toFixed(0))
        .attr('font-family', fontFamily)
        .attr('font-size', fontSize)
        .attr('fill', mainColor);
      textWidth = maxText.node().getComputedTextLength();
      maxText
        .attr('x', Math.min(max + textWidth / 2, width + padding * 2) - textWidth)
        .attr('y', height - 1);
    },
  };

  // Expose API globally.
  window.DS = Object.assign({}, window.DS || {}, {
    Sparkline
  });
})(window);
