((window) => {
  // TODO: show world data when click outside countries
  let map;

  let width = 0;
  let height = 0;
  let shift = 0;

  let tooltipLeft = 0;
  let tooltipTop = 0;
  let tooltip;

  let scale = 1;
  let initX = 0;
  let mouseClicked = false;
  let selectedCountry = '';
  let zoomExtent = [1, 10];

  let onSelectLocation;

  let projection, path, zoom, g;

  function onStartPanning() {
    d3.event.preventDefault();
    initX = d3.mouse(this)[0];
    mouseClicked = true;
  };

  function onEndPanning() {
    shift = shift + ((d3.mouse(this)[0] - initX) * 360 / (scale * width));
    mouseClicked = false;
  };

  const svg = d3.select('#map svg')
    .on('mousedown', onStartPanning)
    .on('mouseup', onEndPanning);

  function onShiftMap(endX) {
    projection.rotate([shift + (endX - initX) * 360 / (scale * width), 0, 0])
    g.selectAll('path')
      .attr('d', path);
  };

  function showTooltip(name) {
    const mouse = d3.mouse(svg.node())
      .map(function(v) { return parseInt(v); } );
    tooltip.classed('__hidden', false)
      .attr('style', 'left:' + (mouse[0] + tooltipLeft) + 'px;top:' + (mouse[1] + tooltipTop) + 'px')
      .html(name);
  };

  function onClick(id, name) {
    if (selectedCountry !== id) {
      selectedCountry = id;
      d3.select('.__selected').classed('__selected', false);
      d3.select('#' + id).classed('__selected', true);
      onSelectLocation(id, name);
    }
  };

  function onZoomMap() {
    const t = d3.event.translate;
    const h = 0;
    scale = d3.event.scale;

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

    // TODO: call for cities
  };

  function resizeMap() {
    scale = 1;
    width = map.clientWidth;
    height = map.clientHeight;

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
  };

  // Public methods
  const WorldMap = {
    resize() {
      resizeMap();
    },

    showCities(avaliableCities) {
      // TODO
    },

    init(onSelect, avaliableCountries) {
      map = document.getElementById('map');
      tooltip = d3.select('#map .vis-tooltip');
      g = svg.append('g');
      onSelectLocation = onSelect;
      zoom = d3.behavior.zoom().scaleExtent(zoomExtent)

      resizeMap();

      d3.json('data/topology.json', function(error, world) {
        if(error) return console.error(error);

        g.append('g')
          .attr('class', 'vis-world')
          .selectAll('vis-world')
          .data(topojson.feature(world, world.countries).features)
          .enter().append('path')
          .attr('class', 'vis-country')
          .attr('id', function(d) { return d.id; })
          .attr('d', path)
          .each(function(d) {
            const item = d3.select(this);
            const filter = avaliableCountries.filter((country) => country.code === d.id);
            if (filter.length > 0) {
              item
                .on('mousedown', function(d) { onClick(d.id, filter[0].name); })
                .on('mousemove', function(d) { showTooltip(filter[0].name); })
                .on('mouseout',  function(d, i) { tooltip.classed('__hidden', true); });
            } else {
              item
                .attr('class', 'vis-country __disabled');
            }
          });
      });
    },
  };

  // Expose API globally.
  window.DS = Object.assign({}, window.DS || {}, {
    WorldMap
  });
})(window);
