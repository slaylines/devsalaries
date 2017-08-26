function initSparkline(divId, mainSalary, salary) {
  var width = 180,
      height = 21,
      padding = 10,
      top = 5,
      radius = 3;

  var mainColor = '#333',
      lineColor = '#999',
      accentColor = '#c85000';

  var fontFamily = 'sans-serif',
      fontSize = '12px';

  //calculate positions
  var minValue = Math.min(mainSalary.min, salary.min);
  var maxValue = Math.max(mainSalary.max, salary.max);

  var min = padding + width * (mainSalary.min - minValue) / (maxValue - minValue);
  var max = padding + width * (mainSalary.max - minValue) / (maxValue - minValue);
  var av = padding + width * (mainSalary.average - minValue) / (maxValue - minValue);


  var div = d3.select('#' + divId);
  div.selectAll('svg').remove()

  var svg = div
    .append('svg')
    .attr('width', width + padding * 2)
    .attr('height', height);

  var g = svg.append('g');

  // add line
  g.append('line')
    .style('stroke', lineColor)
    .attr('x1', min)
    .attr('y1', top)
    .attr('x2', max)
    .attr('y2', top); 

  // add 3 points on line
  g.append('circle')
    .style('fill', mainColor)
    .attr('cx', min)
    .attr('cy', top)
    .attr('r', radius);

  g.append('circle')
    .style('fill', mainColor)
    .attr('cx', max)
    .attr('cy', top)
    .attr('r', radius);

  g.append('circle')
    .style('fill', accentColor)
    .attr('cx', av)
    .attr('cy', top)
    .attr('r', radius);

  // add text values - shift by half of width
  var avText = g.append('text')
    .text(mainSalary.average)
    .attr('font-family', fontFamily)
    .attr('font-size', fontSize)
    .attr('fill', accentColor);
  var textWidth = avText.node().getComputedTextLength();
  avText
    .attr('x', av - textWidth / 2)
    .attr('y', height - 1);

  var minText = g.append('text')
    .text(mainSalary.min)
    .attr('font-family', fontFamily)
    .attr('font-size', fontSize)
    .attr('fill', mainColor);
  textWidth = minText.node().getComputedTextLength();
  minText
    .attr('x', Math.max(min - textWidth / 2, 0))
    .attr('y', height - 1);

  var maxText = g.append('text')
    .text(mainSalary.max)
    .attr('font-family', fontFamily)
    .attr('font-size', fontSize)
    .attr('fill', mainColor);
  textWidth = maxText.node().getComputedTextLength();

  maxText
    .attr('x', Math.min(max + textWidth / 2, width + padding * 1.5) - textWidth)
    .attr('y', height - 1);
};
