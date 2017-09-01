((window) => {
  // variables for map container
  let map;
  let width = 0;
  let height = 0;

  // main svg element
  const svg = d3
    .select('#map svg')
    .on('click', function() { onClick(''); })
    .on('touchend', function() { onClick(''); });

  // variables for tooltip container
  let tooltip;
  let tooltipLeft = 0;
  let tooltipTop = 0;

  // variables and constants for navigation
  let initScale;
  const maxZoomExtent = 30;
  const minZoomForCities = 3;
  let initial;

  // currently selected locations
  let selectedLocation = null;

  // font size and shift for city markers
  const fontAwesomeSize = 20;
  const markerShift = 5.71;

  // callback for selection
  let onSelectLocation;

  // variables for rerendering map
  const projection = d3.geo.mercator();
  const path = d3.geo
    .path()
    .projection(projection);
  let zoom;

  let mainGroup, mapGroup, citiesGroup;

  // array of avaliable cities
  let cities;
  let citiesVisible = true;

  // show tooltip near mouse pointer with given text
  function showTooltip(name) {
    const mouse = d3.mouse(svg.node())
      .map(function(v) { return parseInt(v); } );
    tooltip.classed('__hidden', false)
      .attr('style', 'left:' + (mouse[0] + tooltipLeft) + 'px;top:' + (mouse[1] + tooltipTop) + 'px')
      .html(name);
  };

  function getCityId(coords, name) {
    return `${name}${coords.lon}${coords.lat}`.replace(/[., ]/g, '');
  };

  // select location: world, country or city
  function onClick(id, object, isCity) {
    d3.event.preventDefault();
    d3.event.stopPropagation();

    const changed = selectedLocation !== id;

    if (changed) {
      if (selectedLocation) {
        d3.select('.__selected').classed('__selected', false);
      }
      selectedLocation = id;

      if (id) {
        d3.select(`#${id}`).classed('__selected', true);
        onSelectLocation(object);
      } else {
        onSelectLocation();
      }
    }

    hideHint();
  };

  function hideHint() {
    if (initial) {
      document.querySelector('#vis-map-hint')
        .classList.add('__hidden');
      initial = false;
    }

  };

  function hideCities() {
    if (citiesVisible) {
      citiesGroup.style('display', 'none');
      citiesVisible = false;
    }
  };

  function showCities() {
    if (!citiesVisible) {
      citiesGroup.style('display', 'inline-block');
      citiesVisible = true;
    }
  };

  // add throttle for zoom event
  function throttle (callback, limit) {
    let wait = false;

    return function () {
      if (!wait) {
        callback();
        wait = true;
        setTimeout(function () {
          wait = false;
        }, limit);
      }
    }
  }

  // zooming map
  function onZoomMap() {
    const zoomScale = zoom.scale()

    projection
      .translate(zoom.translate())
      .scale(zoomScale);

    mainGroup.selectAll('path')
      .attr('d', path);

    if (zoomScale >= initScale * minZoomForCities) {
      showCities();
      updateCities();
    } else {
      hideCities()
    }

    hideHint();
  };

  function updateCities() {
    cities.forEach((city) => {
      const coords = projection([city.coords.lon, city.coords.lat]);
      const lon = coords[0] - markerShift;

      const cityObj = citiesGroup
        .select(`.vis-cities #${city.id}`)
        .attr('x', lon)
        .attr('y', coords[1]);

      if (selectedLocation === city.id) {
        cityObj.attr('class', 'vis-city __selected');
      }
    });
  };

  // rerender cities after pan or zoom
  function initCities() {
    hideCities();

    citiesGroup
      .selectAll('.vis-cities')
      .data(cities).enter()
      .append('text')
      .attr('class', 'vis-city')
      .attr('id', function(city) { return city.id })
      .attr('font-family','FontAwesome')
      .attr('font-size', fontAwesomeSize)
      .text(function(d) { return '\uf041'; })
      .on('click', function(city) { onClick(city.id, city, true); })
      .on('touchend', function(city) { onClick(city.id, city, true); })
      .on('mousemove', function(city) { showTooltip(city.city); })
      .on('mouseout',  function() { tooltip.classed('__hidden', true); });
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

    cities.forEach((city) => {
      city.id = getCityId(city.coords, city.city);
    });
  };

  // init map after loading or resize
  function initMap() {
    width = map.clientWidth;
    height = map.clientHeight;
    initScale = (Math.min(width, height) - 1) / 2 / Math.PI;

    tooltipLeft = map.offsetLeft + 10;
    tooltipTop = map.offsetTop + 10;

    zoom = d3.behavior.zoom()
      .translate([width / 2, height / 2])
      .scale(initScale)
      .scaleExtent([initScale, maxZoomExtent * initScale])
      .on('zoom', throttle(onZoomMap, 25));

    svg
      .attr('width', width)
      .attr('height', height)
      .call(zoom)
      .call(zoom.event);

    // Handle mobile pinch gesture.
    const hammertime = new Hammer(svg.node());
    hammertime.get('pinch').set({ enable: true });
    hammertime.on('pinch', () => {
      svg.call(zoom.event);
    });
  }

  // Public methods
  const WorldMap = {
    resize() {
      initMap();
      updateCities();
    },

    init(onSelect, avaliableCountries) {
      onSelectLocation = onSelect;
      map = document.getElementById('map');
      tooltip = d3.select('#map .vis-tooltip');

      mainGroup = svg.append('g');
      mapGroup = mainGroup
        .append('g')
        .attr('class', 'vis-world');
      citiesGroup = mainGroup
        .append('g')
        .attr('class', 'vis-cities');

      initMap();
      getCities();
      initCities();
      updateCities();

      initial = true;

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
                .on('click', function(d) { onClick(d.id, filter[0]); })
                .on('touchend', function(d) { onClick(d.id, filter[0]); })
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
