let src = 'https://latitudes.in/bing_sms.mp3';
let audio = new Audio(src);
let states = [];
let dists = [];
let district_id = 363;
let activeInterval = false;

const today = new Date()
const yesterday = new Date(today)

yesterday.setDate(yesterday.getDate() - 1)
let d = yesterday;
let ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d);
let mo = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(d);
let da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d);
const dateFormat = `${da}-${mo}-${ye}`;

413310
const columnDefs = [
    { field: "address", headerName: "Address" },
    { field: "pincode", 
    headerName: "Pincode",
    field: "country",
    cellRenderer: function(params) {
        return '<a href="https://www.google.com/maps/place/'+params.data.pincode + '" target="_blank">'+ params.data.pincode+'</a>'
    }},
    { field: "vaccine", headerName: "Vaccine Type" },
    { field: "available_capacity", headerName: "Dose" },
    { field: "min_age_limit" }
  ];
  
  // specify the data
  var rowData = [{
    "address": "address",
    "pincode": "pincode",
    "vaccine": "vaccine",
    "available_capacity": "available_capacity",
    "min_age_limit": "Age criteria"
}];


var search = function(){
  var searchDate = "08-05-2021";
  // Create a new XMLHttpRequest.
  var request = new XMLHttpRequest();

    // Handle state changes for the request.
    request.onreadystatechange = function (response) {
        $("#result").empty();
        rowData = [];
        let isDoseAvailable = false;
        if (request.readyState === 4) {
            if (request.status === 200) {
                // Parse the JSON
                var jsonOptions = JSON.parse(request.responseText).centers;
                // Loop over the JSON array.
                for(var j=0; j <  jsonOptions.length; j++){
                    for(var i=0; i <  jsonOptions[j].sessions.length; i++){
                        if(jsonOptions[j].sessions[i].available_capacity > 0 && new Date(jsonOptions[j].sessions[i].date) > new Date(searchDate)){
                            $("#ag-grid-container").show();
                            isDoseAvailable = true;
                            console.log("Rhushi : Location '", jsonOptions[j].address, jsonOptions[j].pincode, "' Available dose ", jsonOptions[j].sessions[i].min_age_limit, jsonOptions[j].sessions[i].vaccine, jsonOptions[j].sessions[i].available_capacity);
                                rowData.push({
                                        "address": jsonOptions[j].address,
                                        "pincode": jsonOptions[j].pincode,
                                        "vaccine": jsonOptions[j].sessions[i].vaccine,
                                        "available_capacity": jsonOptions[j].sessions[i].available_capacity,
                                        "min_age_limit": jsonOptions[j].sessions[i].min_age_limit
                                });
                                gridOptions.api.setRowData(rowData);
                                audio.play();
                            }else if(jsonOptions[j].sessions[i].available_capacity == 0 && !isDoseAvailable){
                                $("#ag-grid-container").hide();
                                $("#result").empty();
                                $("#result").append("no dose available");
                            }
                }
                }
            }
        }
    };
    $("#result").append("Loading...");
    // Set up and make the request.
    request.open('GET', 'https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id='+district_id+'&date='+dateFormat+ '', true);
    request.send();
}

updateStates = function(){
    var dataList = document.getElementById('state-datalist');
    // var input = document.getElementById('state');

    // Create a new XMLHttpRequest.
    var request = new XMLHttpRequest();

    // Handle state changes for the request.
    request.onreadystatechange = function (response) {
        $("#result").empty();
        if (request.readyState === 4) {
            if (request.status === 200) {
                // Parse the JSON
                var jsonOptions = JSON.parse(request.responseText);
                states = jsonOptions.states;
                // Loop over the JSON array.
                states.forEach(function (item) {
                    // create a new option
                    const option = new Option(item.state_name, item.state_id);
                    // add it to the list
                    dataList.add(option, undefined);
                });

                // Update the placeholder text.
                $("#result").append("Select State ... default search is for Pune");
            } else {
                // An error occured :(
                $("#result").append("Couldn't load states :(");
            }
        }
    };

    // Update the placeholder text.
    $("#result").append("Loading...");

    // Set up and make the request.
    request.open('GET', 'https://cdn-api.co-vin.in/api/v2/admin/location/states', true);
    request.send();
}
updateSearch = function(){
    var distList = document.getElementById('dist-datalist');
    district_id = distList.selectedOptions[0].value;
    search();
}
updateDist = function(){
    var stateList = document.getElementById('state-datalist');
    var distList = document.getElementById('dist-datalist');

    // Create a new XMLHttpRequest.
    var request = new XMLHttpRequest();

    // Handle state changes for the request.
    request.onreadystatechange = function (response) {
        $("#result").empty();
        if (request.readyState === 4) {
            if (request.status === 200) {
                // Parse the JSON
                var jsonOptions = JSON.parse(request.responseText);
                dists = jsonOptions.districts;
                // Loop over the JSON array.
                dists.forEach(function (item) {
                    // create a new option
                    const option = new Option(item.district_name, item.district_id);
                    // add it to the list
                    distList.add(option, undefined);
                });

                // Update the placeholder text.
                $("#result").append("Select District");
            } else {
                // An error occured :(
                $("#result").append("Couldn't load states :(");
            }
        }
    };

    // Update the placeholder text.
    $("#result").append("Loading...");

    // Set up and make the request.
    request.open('GET', 'https://cdn-api.co-vin.in/api/v2/admin/location/districts/' + stateList.selectedOptions[0].value, true);
    request.send();
}

  
  // let the grid know which columns and what data to use
  const gridOptions = {
    columnDefs: columnDefs,
    defaultColDef: {
        // flex: 1,
        // wrapText: true,
        // autoHeight: true,
        sortable: true,
        resizable: false,
        filter: true,
    },
    animateRows: true,
    sideBar: ['columns','filters'],
    rowData: rowData
  };
  
  // setup the grid after the page has finished loading
  document.addEventListener('DOMContentLoaded', () => {
      const gridDiv = document.querySelector('#data-grid');
      new agGrid.Grid(gridDiv, gridOptions);
      $("#ag-grid-container").hide();
  });

  const instervalSearch = () => {
    $("#result").empty();
    if(!activeInterval){
        activeInterval = true;
        setInterval(search, 10000);
        audio.play();
        $("#result").append("You will hear this sound when slot is open... do not close browser window / tab. refresh page to stop watch on open slots...");
    }else{
        audio.play();
        $("#result").append("You will hear this sound when slot is open... do not close browser window / tab. refresh page to stop watch on open slots...");
    }
  }