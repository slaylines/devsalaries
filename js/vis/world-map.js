((window) => {

  // variables for map container
  let map;
  let width = 0;
  let height = 0;
  let shift = 0;

  // variables for tooltip container
  let tooltip;
  let tooltipLeft = 0;
  let tooltipTop = 0;

  // variables and constants for navigation
  let initX = 0;
  let scale = 1;
  let mouseClicked = false;
  const zoomExtent = [1, 50];
  const minZoomForCities = 3;

  // currently selected locations
  let selectedCountry = '';
  let selectedCity;

  // constants for
  const fontAwesomeSize = 20;
  const markerRadius = 5.52;

  // callback for selection
  let onSelectLocation;

  // d3js variables for rerendering map
  let projection, path, zoom, mainGroup, citiesGroup;

  // array of avaliable cities
  let cities;

  // mouseDown handler on svg
  function onStartPanning() {
    d3.event.preventDefault();
    initX = d3.mouse(this)[0];
    mouseClicked = true;
  };

  // mouseDown handler on svg
  function onEndPanning() {
    shift = shift + ((d3.mouse(this)[0] - initX) * 360 / (scale * width));
    mouseClicked = false;
  };

  // main svg element, when clicked - select all world
  const svg = d3.select('#map svg')
    .on('click', function() { onClick(''); })
    .on('mousedown', onStartPanning)
    .on('mouseup', onEndPanning);

  // panning map
  function onShiftMap(endX) {
    projection.rotate([shift + (endX - initX) * 360 / (scale * width), 0, 0])
    mainGroup.selectAll('path')
      .attr('d', path);

    // update cities markers while panning
    updateCities();
  };

  // show tooltip near mouse pointer with given text
  function showTooltip(name) {
    const mouse = d3.mouse(svg.node())
      .map(function(v) { return parseInt(v); } );
    tooltip.classed('__hidden', false)
      .attr('style', 'left:' + (mouse[0] + tooltipLeft) + 'px;top:' + (mouse[1] + tooltipTop) + 'px')
      .html(name);
  };

  function getCityId(coords, name) {
    return `${name}${coords.lon}${coords.lat}`.replace(/[.]/g, '');
  };

  // select location: world, country or city
  function onClick(id, name, isCity) {
    d3.event.preventDefault();
    d3.event.stopPropagation();

    if (isCity) {
      if (selectedCountry) {
        selectedCountry = '';
        d3.select('.vis-country.__selected').classed('__selected', false);
      }
      if (selectedCity !== id) {
        selectedCity = id;
        d3.select('.vis-city.__selected').classed('__selected', false);
        d3.select(`#${getCityId(id, name.city)}`).classed('__selected', true);
        onSelectLocation(id, name);
      }
    } else {
      if (selectedCity) {
        selectedCity = null;
        d3.select('.vis-city.__selected').classed('__selected', false);
      }
      if (selectedCountry !== id) {
        selectedCountry = id;
        d3.select('.vis-country.__selected').classed('__selected', false);
        if (id) {
          d3.select('#' + id).classed('__selected', true);
          onSelectLocation(id, name);
        } else {
          onSelectLocation();
        }
      }
    }
  };

  // get [lon, lat] coordinates of point on screen
  function getPoint(x, y) {
    const container = mainGroup.node();
    const svg = container.ownerSVGElement || container;
    let point = svg.createSVGPoint();
    point.x = x, point.y = y;
    point = point.matrixTransform(container.getScreenCTM().inverse());
    return projection.invert([point.x, point.y]);
  }

  // zooming map
  function onZoomMap() {
    const transform = d3.event.translate;
    const h = 0;
    const oldScale = scale;
    scale = d3.event.scale;

    transform[0] = Math.min(
      (width/height) * (scale - 1),
      Math.max(width * (1 - scale), transform[0])
    );

    transform[1] = Math.min(
      h * (scale - 1) + h * scale,
      Math.max(height * (1 - scale) - h * scale, transform[1])
    );

    zoom.translate(transform);
    if (mouseClicked) {
      onShiftMap(d3.mouse(this)[0]);
      return;
    }

    mainGroup.attr('transform', `translate(${transform})scale(${scale})`);
    d3.selectAll('.vis-world')
      .style('stroke-width', 0.5 / scale);
    d3.selectAll('.vis-city')
      .attr('font-size', fontAwesomeSize / scale);

    updateCities();
  };

  // rerender cities after pan or zoom
  function updateCities() {
    citiesGroup
      .style('display', scale < minZoomForCities ? 'none' : 'inline-block')
      .selectAll('.vis-city')
      .remove()

    citiesGroup
      .selectAll('.vis-cities')
      .data(cities).enter()
      .append('text')
      .attr('class', function(d) {
        return d.coords === selectedCity
          ? 'vis-city __selected'
          : 'vis-city';
      })
      .attr('id', function(d) { return getCityId(d.coords, d.city); })
      .attr('x', function(d) { return projection([d.coords.lon, d.coords.lat])[0] - markerRadius / scale; })
      .attr('y', function(d) { return projection([d.coords.lon, d.coords.lat])[1]; })
      .attr("font-family","FontAwesome")
      .attr('font-size', fontAwesomeSize / scale)
      .text(function(d) { return '\uf041'; })
      .on('click', function(d) {
        onClick(d.coords, {city: d.city, country: d.country}, true);
      })
      .on('mousemove', function(d) { showTooltip(d.city); })
      .on('mouseout',  function() { tooltip.classed('__hidden', true); });
  };

  // get and store list of avaliable cities
  function getCities() {
    const topLeft = getPoint(0, 0);
    const bottomRight = getPoint(width, height);

    cities = DS.DataApi.getCitiesInRect({
      x: topLeft[0],
      y: bottomRight[1],
      width: bottomRight[0] - topLeft[0],
      height: topLeft[1] - bottomRight[1]
    });
  };

  // init map after loading or resize
  function initMap() {
    scale = 1;
    width = map.clientWidth;
    height = map.clientHeight;

    tooltipLeft = map.offsetLeft + 10;
    tooltipTop = map.offsetTop + 10;

    projection = d3.geo.mercator()
      .scale(Math.min(width, height) * 0.2)
      .translate([width / 2, height / 1.5])
      .rotate([shift, 0, 0]);

    zoom = d3.behavior
      .zoom()
      .scaleExtent(zoomExtent)
      .on('zoom', onZoomMap);

    path = d3.geo
      .path()
      .projection(projection);

    svg
      .attr('width', width)
      .attr('height', height)
      .call(zoom);
  }

  // Public methods
  const WorldMap = {
    resize() {
      initMap();
      onShiftMap(initX);
      updateCities();
    },

    init(onSelect, avaliableCountries) {
      onSelectLocation = onSelect;

      map = document.getElementById('map');
      tooltip = d3.select('#map .vis-tooltip');

      mainGroup = svg.append('g');
      const mapGroup = mainGroup
        .append('g')
        .attr('class', 'vis-world');
      citiesGroup = mainGroup
        .append('g')
        .attr('class', 'vis-cities');

      initMap();
      getCities();
      updateCities();

      d3.json('data/topology.json', function(error, world) {
        if(error) return console.error(error);

        mapGroup
          .selectAll('.vis-world')
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
                .on('click', function(d) { onClick(d.id, filter[0].name); })
                .on('mousemove', function(d) { showTooltip(filter[0].name); })
                .on('mouseout',  function(d, i) { tooltip.classed('__hidden', true); });
            } else {
              item.attr('class', 'vis-country __disabled');
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
