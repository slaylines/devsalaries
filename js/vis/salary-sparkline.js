((window) => {
  // Sparkline graph object
  const Sparkline = {
    init(divId, mainSalary, salary) {
      const width = 460;
      const height = 38;
      const padding = 11;
      const top = height / 2;
      const barHeight = 5.5;

      const mainColor = '#333';
      const accentColor = '#c85000';

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
        .style('stroke', mainColor)
        .attr('x1', min)
        .attr('y1', top)
        .attr('x2', minQ)
        .attr('y2', top);

      g.append('line')
        .style('stroke', mainColor)
        .attr('x1', maxQ)
        .attr('y1', top)
        .attr('x2', max)
        .attr('y2', top);

      // add min and max points on line
      [min, max].forEach((value) => {
        g.append('line')
          .style('stroke', mainColor)
          .attr('x1', value)
          .attr('y1', top - barHeight / 2)
          .attr('x2', value)
          .attr('y2', top + barHeight / 2);
      });

      // add median point
      g.append('line')
        .style('stroke', accentColor)
        .style('stroke-width', 2)
        .attr('x1', median)
        .attr('y1', top - barHeight)
        .attr('x2', median)
        .attr('y2', top + barHeight);

      // add box rect
      g.append('rect')
        .style('fill', 'none')
        .style('stroke', mainColor)
        .attr('x', minQ)
        .attr('y', top - barHeight)
        .attr('width', maxQ - minQ)
        .attr('height', barHeight * 2);

      // add opaque lines
      if (salary.min < mainSalary.min) {
        g.append('line')
          .style('stroke', mainColor)
          .style('stroke-dasharray', '5, 5')
          .style('opacity', 0.6)
          .attr('x1', padding)
          .attr('y1', top)
          .attr('x2', min)
          .attr('y2', top);

        g.append('circle')
          .style('stroke', mainColor)
          .style('opacity', 0.6)
          .attr('r', 0.5)
          .attr('cx', padding)
          .attr('cy', top);
      }

      if (salary.max > mainSalary.max) {
        g.append('line')
          .style('stroke', mainColor)
          .style('stroke-dasharray', '5, 5')
          .style('opacity', 0.6)
          .attr('x1', width + padding)
          .attr('y1', top)
          .attr('x2', max)
          .attr('y2', top);

        g.append('circle')
          .style('stroke', mainColor)
          .style('opacity', 0.6)
          .attr('r', 0.5)
          .attr('cx', width + padding)
          .attr('cy', top);
      }

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
