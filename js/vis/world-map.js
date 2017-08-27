function worldMap() {
  var map;

  var width = 0;
  var height = 0;
  var shift = 0;

  var tooltipLeft = 0;
  var tooltipTop = 0;
  var tooltip;

  var scale = 1;
  var initX = 0;
  var mouseClicked = false;
  var selectedCountry = '';

  var onSelectLocation;

  var projection, path, zoom, g;

  function onStartPanning() {
    d3.event.preventDefault();
    initX = d3.mouse(this)[0];
    mouseClicked = true;
  };

  function onEndPanning() {
    shift = shift + ((d3.mouse(this)[0] - initX) * 360 / (scale * width));
    mouseClicked = false;
  };

  var svg = d3.select('#map svg')
    .on('mousedown', onStartPanning)
    .on('mouseup', onEndPanning);

  function onShiftMap(endX) {
    projection.rotate([shift + (endX - initX) * 360 / (scale * width), 0, 0])
    g.selectAll('path')
      .attr('d', path);
  }

  function showTooltip(d) {
    var label = d.properties.name;
    var mouse = d3.mouse(svg.node())
      .map(function(d) { return parseInt(d); } );
    tooltip.classed('__hidden', false)
      .attr('style', 'left:' + (mouse[0] + tooltipLeft) + 'px;top:' + (mouse[1] + tooltipTop) + 'px')
      .html(label);
  }

  function onClick(country) {
    if (selectedCountry !== this.id) {
      selectedCountry = this.id;
      d3.select('.__selected').classed('__selected', false);
      d3.select(this).classed('__selected', true);
      onSelectLocation(this.id);
    }
  }

  function onZoomMap() {
    var t = d3.event.translate;
    scale = d3.event.scale;
    var h = 0;

    t[0] = Math.min(
      (width/height) * (scale - 1),
      Math.max(width * (1 - scale), t[0])
    );

    t[1] = Math.min(
      h * (scale - 1) + h * scale,
      Math.max(height * (1 - scale) - h * scale, t[1])
    );

    zoom.translate(t);
    if (mouseClicked) {
      onShiftMap(d3.mouse(this)[0]);
      return;
    }

    g.attr('transform', 'translate(' + t + ')scale(' + scale + ')');
    d3.selectAll('.vis-world')
      .style('stroke-width', 0.5 / scale);
  }

  function resizeMap() {
    scale = 1;
    width = map.clientWidth;
    height = map.clientWidth;

    tooltipLeft = map.offsetLeft + 10;
    tooltipTop = map.offsetTop + 10;

    projection = d3.geo.mercator()
      .scale(Math.min(width, height) * 0.2)
      .translate([width / 2, height / 1.5])
      .rotate([shift, 0, 0]);

    zoom.on('zoom', onZoomMap);

    path = d3.geo
      .path()
      .projection(projection);

    svg
      .attr('width', width)
      .attr('height', height)
      .call(zoom);

    onShiftMap(initX);
  }

  function initWorldMap(onSelect) {
    map = document.getElementById('map');
    tooltip = d3.select('#map .vis-tooltip');
    g = svg.append('g');
    onSelectLocation = onSelect;
    zoom = d3.behavior.zoom().scaleExtent([1, 5])

    resizeMap();

    d3.json('data/topology.json', function(error, world) {
      if(error) return console.error(error);

      g.append('g')
        .attr('class', 'vis-world')
        .selectAll('vis-world')
        .data(topojson.feature(world, world.countries).features)
        .enter().append('path')
        .attr('class', 'vis-country')
        .attr('name', function(d) { return d.properties.name; })
        .attr('id', function(d) { return d.id; })
        .on('click', onClick)
        .on('mousemove', showTooltip)
        .on('mouseout',  function(d,i) {
            tooltip.classed('__hidden', true);
         })
        .attr('d', path);
    });
  }

  return {
    initWorldMap,
    resizeMap
  };
};
