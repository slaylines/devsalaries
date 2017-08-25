(() => {
  const getEntries = () => {
    const db = firebase.database();
    return db.ref('entries').once('value').then((snapshot) => {
      const entries = snapshot.val();

      // NOTE: For testing purposes...
      Object.entries(entries).forEach(([key, entry]) => {
        const p = document.createElement('p');
        p.innerText = JSON.stringify(entry);
        document.querySelector('.content').appendChild(p);
      });
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    //getEntries();
    
    var content = document.getElementById('content');
    var width = content.offsetWidth / 1.5,
        height = content.offsetHeight,
        rotated = -10;

    //track where mouse was clicked
    var initX;
    //track scale only rotate when s === 1
    var s = 1;
    var mouseClicked = false;

    var projection = d3.geo.mercator()
      .scale(140)
      .translate([width / 2, height / 1.5])
      .rotate([rotated, 0, 0]);

    var zoom = d3.behavior.zoom()
      .scaleExtent([1, 20])
      .on("zoom", zoomed);

    var svg = d3.select("#map").append("svg")
      .attr("width", width)
      .attr("height", height)
      //track where user clicked down
      .on("mousedown", function() {
        d3.event.preventDefault(); 
        //only if scale === 1
        if(s !== 1) return;
        initX = d3.mouse(this)[0];
        mouseClicked = true;
      })
      .on("mouseup", function() {
        if(s !== 1) return;
        rotated = rotated + ((d3.mouse(this)[0] - initX) * 360 / (s * width));
        mouseClicked = false;
      })
      .call(zoom);

    function rotateMap(endX) {
      projection.rotate([rotated + (endX - initX) * 360 / (s * width),0,0])
      g.selectAll('path')       // re-project path data
        .attr('d', path);
    }

    //for tooltip 
    var offsetL = document.getElementById('map').offsetLeft + 10;
    var offsetT = document.getElementById('map').offsetTop + 10;

    var path = d3.geo.path()
      .projection(projection);

    var tooltip = d3.select("#map")
      .append("div")
      .attr("class", "tooltip hidden");

    //need this for correct panning
    var g = svg.append("g");

    //det json data and draw it
    d3.json("data/topology.json", function(error, world) {
      if(error) return console.error(error);

      g.append("g")
        .attr("class", "boundary")
        .selectAll("boundary")
        .data(topojson.feature(world, world.countries).features)
        .enter().append("path")
        .attr("name", function(d) {return d.properties.name;})
        .attr("id", function(d) { return d.id;})
        .on('click', selected)
        .on("mousemove", showTooltip)
        .on("mouseout",  function(d,i) {
            tooltip.classed("hidden", true);
         })
        .attr("d", path);
    });

    function showTooltip(d) {
      label = d.properties.name;
      var mouse = d3.mouse(svg.node())
        .map(function(d) { return parseInt(d); } );
      tooltip.classed("hidden", false)
        .attr("style", "left:" + (mouse[0] + offsetL) + "px;top:" + (mouse[1] + offsetT) + "px")
        .html(label);
    }

    function selected() {
      d3.select('.selected').classed('selected', false);
      d3.select(this).classed('selected', true);
    }

    function zoomed() {
      var t = d3.event.translate;
      s = d3.event.scale; 
      var h = 0;

      t[0] = Math.min(
        (width/height)  * (s - 1), 
        Math.max( width * (1 - s), t[0] )
      );

      t[1] = Math.min(
        h * (s - 1) + h * s, 
        Math.max(height  * (1 - s) - h * s, t[1])
      );

      zoom.translate(t);
      if (s === 1 && mouseClicked) {
        rotateMap(d3.mouse(this)[0]);
        return;
      }

      g.attr("transform", "translate(" + t + ")scale(" + s + ")");

      //adjust the stroke width based on zoom level
      d3.selectAll(".boundary")
        .style("stroke-width", 0.5 / s);
    }

  });
})();
