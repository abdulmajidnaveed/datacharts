(function init(){


    var airports = [];       // stores the airports.csv data
    var map;                 // stores the map data from datamaps
    var wlSample = [];       // stores the wildlife data
    var airportIDs = [];     // stores the airportIDs
    var groupUnknowns = false;
    var debug = 0;

    /*
    Draw USA map using Datamap
    show states labels
    */
    function initializeMap(){
        map = new Datamap({
            element: document.getElementById('map'),
            scope: 'usa',
            fills: {
                origin: '#AA2519',
                defaultFill: '#E9D3A1'
            },
            geographyConfig: {
                popupOnHover: true,
                highlightOnHover: true
            },
            setProjection: function(element, options) {
                var projection = d3.geo.albersUsa()
                        .scale(element.offsetWidth)
                        .translate([element.offsetWidth / 2.5, element.offsetHeight / 2.3]);

                var path = d3.geo.path().projection(projection);
                return {
                    path: path,
                    projection: projection
                };
            }
        });
        map.labels();
    }


    /*
    * Read in airplane strike data and stores it in wlSample
    * editAirportID: edit the airport IDs
    *  (remove the initial 'K' from the airport IDs to match iatacode from airports.csv)
    */
    function fetchWildLifeDataSample() {
        d3.csv('data/wildlife.csv', function(data) {
            wlSample = data.map(function(d) {
                return d;
            });
            function editAirportID(data, index, array, fieldname, replace, value, mode) {
                var newObj = data;
                if (newObj[fieldname] === replace) {
                    newObj[fieldname] = value;
                    if(mode != 0) {
                        console.log("fixed index : ", index);
                    }
                }
                return newObj;
            }
// where is this edited being used? .... NN
            var edited = data.map(function(d, index, array) {
                s1 = d.AIRPORT_ID;
                s2 = s1.substring(1, 4); // USA ones have first letter K
                t2= editAirportID(d, index, array, "AIRPORT_ID", s1, s2, 0);
                // replace KFLL with FLL, KSLC with SLC, ...
                return t2;
            });
        });
    }

    // enables the search bar - by $('#dep').prop('disabled', false)
    function enableSearchBar(){
        $('#dep').prop('disabled', false);
    }

    // Read in airports.csv data, store it to variable airports
    // enable search bar
    function fetchAirportsData(){
        d3.csv('data/airports.csv', function(data){
            enableSearchBar(); // $('#dep').prop('disabled', false);
            airports = data.map(function(d){
                return {
                    iataCode: d.iata_code,
                    name: d.name,
                    city: d.municipality,
                    latitude: d.latitude_deg,
                    longitude: d.longitude_deg
                };
            }); // rename fields to simpler names NN
            initializeInput();
        });
    }


    /*
    * Read in aircraft-strike data and draw four charts
    *  use crossfilter to get dimensions and grouping
    *  use dc.js to draw the charts
    */
// ===============================================================================================
    function drawCharts(data){
        d3.selectAll('.hidden').classed('hidden', false);
        if (debug>0) console.log('drawCharts data:', data);

        dataTransformed = 
          data.map(function(currentVal, index, arr){return {species: currentVal.SPECIES}})
          if (debug>0) console.log(dataTransformed);

        var crfl = crossfilter(data); // create crossfilter instance
        if (debug>0) console.log('crfl.size():', crfl.size());

        // create dimensions
        var spcsDim = crfl.dimension(function(d) { return d.SPECIES; });
        if (groupUnknowns) {
            var spcsDim2 = crfl.dimension(function(d){ 
                if(d.SPECIES.substring(0,7).toLowerCase()==='unknown'){
                    return 'Unknown'
                } else {
                    return d.SPECIES;
                };
            }); // this is to group "unknown" birds together if wanted
            spcsDim = spcsDim2;
        }

        var monthDim = crfl.dimension(function(d) { return d.INCIDENT_MONTH; });
        var yearDim = crfl.dimension(function(d) { return d.INCIDENT_YEAR; });
        var airportDim = crfl.dimension(function(d) { return d.AIRPORT_ID; })

        // define data groups
        var all = crfl.groupAll(); //all.value() ...
        var numIncidentsBySpecies = spcsDim.group() 
            // .reduceSum(function (d){if (d.SPECIES==='Gulls') {return 2;} else {return 1} })
        // this will double the count of each 'Gulls' record

        // can do .all() on groups

        var numIncidentsByMonth = monthDim.group();
        var numIncidentsByYear = yearDim.group();
        // groups have: reduce, reduceCount, reduceSum, remove, value,

        // numIncidentsBySpecies.all()

        // https://github.com/square/crossfilter/wiki/API-Reference
        var minYear = yearDim.bottom(1)[0]["INCIDENT_YEAR"];
        var maxYear = yearDim.top(1)[0]["INCIDENT_YEAR"];
        var minMonth = monthDim.bottom(1)[0]["INCIDENT_MONTH"];
        var maxMonth = monthDim.top(1)[0]["INCIDENT_MONTH"];

        var speciesChart = dc.barChart('#species-chart');
        var yearChart = dc.barChart('#year-chart');
        var monthChart = dc.barChart('#month-chart');
        var pieChart = dc.pieChart("#pie-chart");


        // adds chart to svg
        speciesChart
            .width(500)
            .height(300)
            .margins({top: 10, right: 80, bottom: 100, left: 30})

            .dimension(spcsDim)
            .group(numIncidentsBySpecies)
            .x(d3.scale.ordinal() .domain(spcsDim) )

           .transitionDuration(500)
            // .x(d3.scale.ordinal().domain(spcsDim))
            .xUnits(dc.units.ordinal)
                        .brushOn(false)
                        .centerBar(false)

            .elasticY(true)
            .elasticX(true)
            .xAxisPadding(10)
            .ordinalColors(['#E1B74D'])
            .yAxisLabel('Frequency')
            .title(function (d) { return "Species: " + d.key + "\nFrequency: " +  d.value; })
            .gap(6) // was 1
            .xAxisLabel('Species')
            .xAxis().tickFormat(function(d) { return '' });

            v1 = speciesChart.xAxis() //.domain()
// speciesChart.xAxis().domain(numIncidentsBySpecies.all().map(function(d){return d.key}))

// xscale=d3.scale.ordinal() .domain(numIncidentsBySpecies.all().map(function(d){return d.key}))
// speciesChart.xAxis().scale(xscale)

      // // console.log('speciesChart:', speciesChart);
      // // console.log('speciesChart.yaxis()', speciesChart.yAxis());
            // you can get the yaxis but it isn't an object you can call properties on
            // so the below fails:
            // var v1 = speciesChart
            //     .yAxis() .style("fill", "green")
            // console.log(v1);

    // // selections with d3 that worked/did the job:    
        // var v2 = d3.select('#species-chart'); console.log(v2);
        // v1=d3.select('#species-chart').select('.axis').select('path').style('color', 'green')
        // v1=d3.selectAll('.axis').select('path').style('fill', 'green')
        //v1=d3.selectAll('.axis').select('path').style('fill', 'none')

        yearChart
            .width(300)
            .height(180)
            .margins({top: 10, right: 50, bottom: 50, left: 30})
            .dimension(yearDim)
            .group(numIncidentsByYear)
            .transitionDuration(500)
            .x(d3.scale.linear().domain([Number(minYear), (Number(maxYear)+1).toString() ]))
//          .x(d3.time.scale().domain([minYear, (Number(maxYear)+1).toString() ]))

            .elasticY(true)
            .xAxisPadding(100)
            .ordinalColors(['#E1B74D'])
            .renderHorizontalGridLines(true)
            .xAxisLabel("Year")
            // .yAxis().ticks(6);

        monthChart
            .width(300)
            .height(180)
            .margins({top: 10, right: 50, bottom: 50, left: 30})
            .dimension(monthDim)
            .group(numIncidentsByMonth)
            .transitionDuration(500)
//            .x(d3.time.scale().domain([1, 12+1]))
            .x(d3.scale.linear().domain([1, 12+1]))
            .elasticY(true)
            .ordinalColors(['#E1B74D'])
            .renderHorizontalGridLines(true)
            .xAxisLabel("Month")
            // .yAxis().ticks(6);

        pieChart
            .width(150)
            .height(150)
            .slicesCap(4+1)
            .dimension(spcsDim)
            .group(numIncidentsBySpecies) // by default, pie charts will use group.key as the label
            .title(function(d) { return 'Species: ' + d.key; })
            .label(function (d) {
                var label = '';
                if (pieChart.hasFilter() && !pieChart.hasFilter(d.key)) {
                    return '0%';
                }
                if (all.value()) {
                    label += '(' + Math.floor(d.value / all.value() * 100) + '%)';
                }
                return label;
            })
            .renderLabel(true);

        dc.renderAll();
                    
        function resetCharts(e){
            var mapDivIdToVariable = {
                'species-chart': speciesChart,
                'year-chart': yearChart,
                'month-chart': monthChart,
                'pie-chart': pieChart
            };
            var container = $(e.target).closest('.dc-chart').attr('id');
            var chart = mapDivIdToVariable[container];
            chart.filterAll();
            dc.redrawAll();
            adjustChartAxesLabels();
        }

        function adjustChartAxesLabels() {
            monthAbbreviation = {
                1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'June',
                7: 'July',8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec'
            };
            speciesChart.selectAll('.axis.x').selectAll('text')
              .text(function(d,i){ return d}) 
              .attr('transform', 'rotate(50)') .style('text-anchor', 'start')
              .attr('dx','1em') .attr('dy','.35em')
            yearChart.selectAll('.axis.x').selectAll('text')
              .text(function(d,i){ return d})
              .attr('transform', 'rotate(50)') .style('text-anchor', 'start')
              .attr('dx','.8em') .attr('dy','-.35em')
            monthChart.selectAll('.axis.x').selectAll('text')
              .text(function(d,i){ return monthAbbreviation[d] })
              .attr('transform', 'rotate(50)') .style('text-anchor', 'start')
              .attr('dx', '.9em') .attr('dy', '-.4em')
              d3.selectAll('.x-axis-label')
              .style('fill', 'navy')
              d3.selectAll('.y-axis-label')
              .style('fill', 'navy')
        }

        function adjustChartAxesColors() {
            v1=d3.selectAll('.axis').select('path').style('fill', 'transparent')
            v2=d3.selectAll('.axis').select('path').style('stroke', 'red')
            v1=d3.selectAll('.axis').selectAll('.tick').attr('fill', 'brown')
            v1=d3.selectAll('.tick line').style('stroke', 'orange')
        }

        // do bar graph plotting axes adjustments
        (function () {
            adjustChartAxesLabels();
            /*
            monthAbbreviation = {
                1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'June',
                7: 'July',8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec'
            };
            // g class = axis x
            //    g class = tick
            //       <line>  - svg .axis path, svg .axis line, svg .tick line
            //       <text>  - svg .axis text, svg .tick text

            speciesChart.selectAll('.axis.x').selectAll('text')
              .text(function(d,i){ return d}) 
              .attr('transform', 'rotate(50)') .style('text-anchor', 'start')
              .attr('dx','1em') .attr('dy','.35em')

            yearChart.selectAll('.axis.x').selectAll('text')
              .attr('transform', 'rotate(50)') .style('text-anchor', 'start')
              .text(function(d,i){ return d})
              .attr('dx','.8em')  .attr('dy','-.35em')

            monthChart.selectAll('.axis.x').selectAll('text')
              .text(function(d,i){
                return monthAbbreviation[d] })// let month = monthAbbreviation[d];console.log(month);return month})
              .attr('transform', 'rotate(50)') .style('text-anchor', 'start')
              .attr('dx', '.9em') .attr('dy', '-.4em')
            */

            adjustChartAxesColors();
            /*
            v1=d3.selectAll('.axis').select('path').style('fill', 'transparent')
            //  var v2=d3.selectAll('.axis')
            //    .selectAll(".tick:not(:first-of-type) line").attr("stroke", "#777")
            v2=d3.selectAll('.axis').select('path').style('stroke', 'red')
    //        v1=d3.selectAll('.axis').select('text').style('stroke', 'orange')
            //v1=d3.selectAll('.axis').selectAll('.tick').attr('fill', 'brown')
            v1=d3.selectAll('.axis').selectAll('.tick').attr('fill', 'brown') // tick text labels
            v1=d3.selectAll('.tick line').style('stroke', 'orange') // tick-lines
            */
        }());

        $('.reset').on('click', resetCharts);
    }

    /*
    * Draws a circle to represent the airport at the appropriate coordinates.
    * Sets the circle size and color(fill).
    * Shows the details on demand on hovering over the airport(circle).
    */
    function drawAirport(originator){
        var paths = [];
        var bubbles = [];
        // console.log(airports);
            var path = {
                origin: {
                    latitude: originator.latitude,
                    longitude: originator.longitude
                },
            };
            paths.push(path);

        originator.radius = 5;
        originator.fillKey = 'origin';

        bubbles.push(originator);

        map.bubbles(bubbles, {
            popupTemplate: function(geo, data) {
                var total = getTotalCostsByAirport(data.iataCode).formatMoney(2,',','.');
                var filter = filterAirports(data.iataCode);
                var html = '<div class="hover-info">'
                    + "Airport Code: " + data.iataCode + '<br>'
                    + "Airport Name: " + data.name + '<br>'
                    + "City: " + data.city + '<br>';
                    if (filter != null) {
                        html += "Total Number of Incidents: " + filter.length + '<br>';
                    }
                    if (total != null) {
                        html += "Total Costs of Repairs: $" + total + '</div>';
                    } else {
                        html += '</div>';
                    }
                return html;
            }
        });
    }

    /*
    * Formats a number to a currency format.
    */
    Number.prototype.formatMoney = function(decPlaces, thouSeparator, decSeparator) {
    var n = this,
        decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces,
        decSeparator = decSeparator == undefined ? "." : decSeparator,
        thouSeparator = thouSeparator == undefined ? "," : thouSeparator,
        sign = n < 0 ? "-" : "",
        i = parseInt(n = Math.abs(+n || 0).toFixed(decPlaces)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
        return sign + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + Math.abs(n - i).toFixed(decPlaces).slice(2) : "");
    };


    /*
    * Gets the total costs of repairs for all struck flights out of airport_id.
    */
    function getTotalCostsByAirport(airport_id) {
        var total = 0;
        var sample = filterAirports(airport_id);
        var arr = [];
        var cost = sample.map(function(d, index, array) {
            var c = d.COST_REPAIRS;
            arr.push(+c);
        });
        if (arr.length > 0) {
            total = arr.reduce(function(a, b) {
                return a + b;
            });
        }
        return total;
    }

    /*
    * Filter airports by airport ID
    * if aiport ID matches from WL and airports data sets
    */
    // airport_id is iatacode 
    function filterAirports(airport_id) {
        var sample =  wlSample.filter(function(d) {
            return d.AIRPORT_ID === airport_id;
        });
        return sample;
    }

    /*
    * Filters the data by airport
    * Draws the charts for the airport selected
    * Draws the airport for the airport selected
    */
    function onAirportChanged(evt, selected) {
        if (debug>0) console.log('onAirportChanged: evt:', evt, ', selected:', selected)
        var sample = filterAirports(selected.iataCode);
        if (debug>0) console.log('sample:', sample);
        if (debug>0) console.log('wlSample:', wlSample);
        // check if sample is NULL
        // if NUll print error message
        if (!sample.length) {
            $('.msg').addClass('in');
            $(this).addClass('error').select();
            return;
        }
        $(this).removeClass('error');
        $('.msg').removeClass('in');

        drawCharts(sample);
        drawAirport(selected);
    }

    /*
    * Takes in the input from the search bar
    * Shows top 10 possible airports depending on the words entered
    */
    function initializeInput(){
       var engine = new Bloodhound({
            name: 'airports',
            local: airports,
            limit: 10,
            datumTokenizer: function(d) {
                var keywords = [d.name, d.iataCode, d.city].join(' ');
                return Bloodhound.tokenizers.whitespace(keywords);
            },
            queryTokenizer: Bloodhound.tokenizers.whitespace
        });

        engine.initialize();

        $('#dep').typeahead(null, {
            name: 'airports',
            displayKey: 'name',
            source: engine.ttAdapter()
        })
        .on('typeahead:selected', onAirportChanged);
    }


    // call
    fetchAirportsData(); // this also initializes the input
    fetchWildLifeDataSample();
    initializeMap();


}());
