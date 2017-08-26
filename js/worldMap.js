function initWorldMap() {
  // map is on the right on larger screens and on the top on smaller
  var content = document.getElementById('content');
  var width = 0,
      height = 0,
      shift = -10;

  if (content.clientWidth >= 1000) {
    width = content.clientWidth / 1.5;
    height = content.clientHeight;
  } else {
    width = content.clientWidth;
    height = content.clientHeight / 2;
  }

  var tooltipLeft = document.getElementById('map').offsetLeft + 10;
  var tooltipTop = document.getElementById('map').offsetTop + 10;

  var s = 1;
  var initX;
  var mouseClicked = false;

  var projection = d3.geo.mercator()
    .scale(Math.min(width, height) * 0.2)
    .translate([width / 2, height / 1.5])
    .rotate([shift, 0, 0]);

  var zoom = d3.behavior.zoom()
    .scaleExtent([1, 5])
    .on('zoom', onZoomMap);

  var svg = d3.select('#map').append('svg')
    .attr('width', width)
    .attr('height', height)
    .on('mousedown', onStartPanning)
    .on('mouseup', onEndPanning)
    .call(zoom);

  var path = d3.geo.path()
    .projection(projection);

  var tooltip = d3.select('#map')
    .append('div')
    .attr('class', 'tooltip __hidden');

  var g = svg.append('g');

  d3.json('data/topology.json', function(error, world) {
    if(error) return console.error(error);

    g.append('g')
      .attr('class', 'world')
      .selectAll('world')
      .data(topojson.feature(world, world.countries).features)
      .enter().append('path')
      .attr('class', 'country')
      .attr('name', function(d) {return d.properties.name;})
      .attr('id', function(d) { return d.id;})
      .on('click', selectCountry)
      .on('mousemove', showTooltip)
      .on('mouseout',  function(d,i) {
          tooltip.classed('__hidden', true);
       })
      .attr('d', path);
  });

  function onStartPanning() {
    d3.event.preventDefault(); 
    initX = d3.mouse(this)[0];
    mouseClicked = true;
  };

  function onEndPanning() {
    shift = shift + ((d3.mouse(this)[0] - initX) * 360 / (s * width));
    mouseClicked = false;
  };

  function onShiftMap(endX) {
    projection.rotate([shift + (endX - initX) * 360 / (s * width), 0, 0])
    g.selectAll('path')
      .attr('d', path);
  }

  function showTooltip(d) {
    label = d.properties.name;
    var mouse = d3.mouse(svg.node())
      .map(function(d) { return parseInt(d); } );
    tooltip.classed('__hidden', false)
      .attr('style', 'left:' + (mouse[0] + tooltipLeft) + 'px;top:' + (mouse[1] + tooltipTop) + 'px')
      .html(label);
  }

  function selectCountry() {
    d3.select('.__selected').classed('__selected', false);
    d3.select(this).classed('__selected', true);
  }

  function onZoomMap() {
    var t = d3.event.translate;
    s = d3.event.scale; 
    var h = 0;

    t[0] = Math.min(
      (width/height) * (s - 1), 
      Math.max(width * (1 - s), t[0])
    );

    t[1] = Math.min(
      h * (s - 1) + h * s, 
      Math.max(height * (1 - s) - h * s, t[1])
    );

    zoom.translate(t);
    if (mouseClicked) {
      onShiftMap(d3.mouse(this)[0]);
      return;
    }

    g.attr('transform', 'translate(' + t + ')scale(' + s + ')');
    d3.selectAll('.world')
      .style('stroke-width', 0.5 / s);
  }
};
