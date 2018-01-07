    uniqueAirportsdebugging = 0;
    function getUniqueAirportsFromWildLifeData(wldata){

        if(uniqueAirportsdebugging>0)console.log('------------------begin getUnique airports')
        dP = {};
        dP.wlDataAirports = wldata.map(function(currentVal,index,array){
            return {"AIRPORT_ID":currentVal.AIRPORT_ID, "AIRPORT":currentVal.AIRPORT};
        })
        if(uniqueAirportsdebugging>0)console.log('wlDataAirports:',dP.wlDataAirports);
        dP.freqCountTable = {};
        dP.uniqueAirports = []; dP.airportCounts = [];
        for(var i=0;i<dP.wlDataAirports.length;i++){
            var currentAirport = dP.wlDataAirports[i]["AIRPORT_ID"];
            if (dP.freqCountTable[currentAirport] == undefined ){
                dP.freqCountTable[currentAirport] = 1; dP.uniqueAirports.push(currentAirport);
            } else {
                dP.freqCountTable[currentAirport] +=1;
            }
        };
        if(uniqueAirportsdebugging>0){
          console.log('freqCount:',dP.freqCountTable);
          console.log('uniqueAirports:',dP.uniqueAirports);}
        dP.airportCounts=[];
        for(var i=0;i<dP.uniqueAirports.length;i++){
            dP.airportCounts[i] = dP.freqCountTable[dP.uniqueAirports[i]];
        };
        if(uniqueAirportsdebugging>0)console.log('airportCounts:',dP.airportCounts);
        function sortWithIndeces(toSort) {
            for (var i = 0; i < toSort.length; i++) {
              toSort[i] = [toSort[i], i];
            }
            toSort.sort(function(left, right) {
              return left[0] < right[0] ? -1 : 1;
            });
            toSort.sortIndices = [];
            for (var j = 0; j < toSort.length; j++) {
              toSort.sortIndices.push(toSort[j][1]);
              toSort[j] = toSort[j][0];
            }
            return toSort;
        }
        // var test = ['b', 'c', 'd', 'a'];
        // sortWithIndeces(test);
        // console.log(test.sortIndices.join(","));
        dP.airportCountsSorted = dP.airportCounts.slice();
        sortWithIndeces(dP.airportCountsSorted);
        if(uniqueAirportsdebugging>0) console.log('airportCountsSorted:',dP.airportCountsSorted);
        dP.freqCountTableSortedAscending=[];
        for (var i=0; i<dP.airportCountsSorted.length; i++){
            var indx = dP.airportCountsSorted.sortIndices[i];
            var airport = dP.uniqueAirports[indx];
            var count = dP.airportCounts[indx];
            dP.freqCountTableSortedAscending.push(airport+':'+count);
        }
        if(uniqueAirportsdebugging>0)console.log('freqCountTableSortedAscending:',dP.freqCountTableSortedAscending);
        dP.freqCountTableSortedDescending=[];
        for (var i=dP.airportCountsSorted.length-1; i>=0; i--){
            var indx = dP.airportCountsSorted.sortIndices[i];
            var airport = dP.uniqueAirports[indx];
            var count = dP.airportCounts[indx];
            dP.freqCountTableSortedDescending.push(
              {'airport': airport, 'count': count}
              // {[airport]: count}
            );
        }
        if(uniqueAirportsdebugging>0)console.log('freqCountTableSortedDescending:',dP.freqCountTableSortedDescending);
        if(uniqueAirportsdebugging>0)console.log('------------------end getUnique airports')
    }
