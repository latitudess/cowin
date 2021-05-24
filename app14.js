let src = "https://latitudes.in/bing_sms.mp3";
let audio = new Audio(src);
let states = [];
let dists = [];
let state_id = 0;
let district_id = 363;

let options = {
  // Namespace. Namespace your Basil stored data
  // default: 'b45i1'
  namespace: "cowin",

  // storages. Specify all Basil supported storages and priority order
  // default: `['local', 'cookie', 'session', 'memory']`
  // storages: ['cookie', 'local'],

  // storage. Specify the default storage to use
  // default: detect best available storage among the supported ones
  // storage: 'cookie',

  // expireDays. Default number of days before cookies expiration
  // default: 365
  expireDays: 31,
};
let basil = new window.Basil(options);

let query = "";
let activeInterval = false,
  hideFilter=true;
let notified = false;
const today = new Date();
const yesterday = new Date(today);

yesterday.setDate(yesterday.getDate() - 1);
let d = today;
let ye = new Intl.DateTimeFormat("en", { year: "numeric" }).format(d);
let mo = new Intl.DateTimeFormat("en", { month: "2-digit" }).format(d);
let da = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(d);
const dateFormat = `${da}-${mo}-${ye}`;

const columnDefs = [
  { field: "address", headerName: "Address" },
  {
    field: "pincode",
    headerName: "Pincode",
    field: "country",
    cellRenderer: function (params) {
      return (
        '<a href="https://www.google.com/maps/place/' +
        params.data.pincode +
        '" target="_blank">' +
        params.data.pincode +
        "</a>"
      );
    },
  },
  { field: "vaccine", headerName: "Vaccine Type" },
  { field: "available_capacity", headerName: "Dose" },
  { field: "min_age_limit" },
];

// specify the data
var rowData = [
  {
    address: "address",
    pincode: "pincode",
    vaccine: "vaccine",
    available_capacity: "available_capacity",
    min_age_limit: "Age criteria",
  },
];

const applyFilter = (session, center) => {
  let age = basil.get("age-group") ? [basil.get("age-group")] : ["18", "45"];
  let pay = basil.get("payment") ? [basil.get("payment")] : ["free", "paid"];
  let vaccine = basil.get("vaccine-type")
    ? [basil.get("vaccine-type")]
    : ["covishield", "covaxin", "sputnik v"];
  let dose = basil.get("dose-period") ? basil.get("dose-period") : "0";

  if (
    age.indexOf(session.min_age_limit.toString()) !== -1 &&
    vaccine.indexOf(session.vaccine.toLowerCase()) !== -1 &&
    pay.indexOf(center.fee_type.toLowerCase()) !== -1
  ) {
    switch (dose) {
      case "1":
        if (session.available_capacity_dose1 > 0) {
          return true;
        } else {
          return false;
        }
        break;
      case "2":
        if (session.available_capacity_dose2 > 0) {
          return true;
        } else {
          return false;
        }
        break;
      default:
        return true;
        break;
    }
  } else {
    console.log("No data for filter...");
    return false;
  }
};

function tConvert (timeString) {
  var H = +timeString.substr(0, 2);
  var h = (H % 12) || 12;
  var ampm = H < 12 ? "AM" : "PM";
  timeString = h + timeString.substr(2, 3) + ampm;
  return timeString;
}

var search = function (privateUrl) {
  let srvUrl = privateUrl
    ? "https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?district_id="
    : "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=";

  var searchDate = today;
  // Create a new XMLHttpRequest.
  var request = new XMLHttpRequest();

  // Handle state changes for the request.
  request.onreadystatechange = function (response) {
    $("#table-row-content").empty();
    $("#query").empty();
    notifyResult("", true);
    rowData = [];
    let isDoseAvailable = false;
    if (request.readyState === 4) {
      if (request.status === 409 || request.status === 401) {
        notifyResult(
          "Retrying with Public channel... Error with private channel... open COWIN app in another tab and check again.."
        );
        search(false);
      } else if (request.status === 200) {
        let dataCount = 0;
        // Parse the JSON
        var jsonOptions = JSON.parse(request.responseText).centers;
        // Loop over the JSON array.
        for (var j = 0; j < jsonOptions.length; j++) {
          for (var i = 0; i < jsonOptions[j].sessions.length; i++) {
            if (
              jsonOptions[j].sessions[i].available_capacity > 0
            ) {
              if (applyFilter(jsonOptions[j].sessions[i], jsonOptions[j])) {
                $("#ag-grid-container").show();
                notifyResult("", true);
                if (!notified) {
                  notifyMe(
                    "Please login to COWIN for Vaccine slot registration...!"
                  );
                  notified = true;
                }
                isDoseAvailable = true;
                console.log(
                  "Rhushi : Location '",
                  jsonOptions[j].address,
                  jsonOptions[j].pincode,
                  "' Available dose ",
                  jsonOptions[j].sessions[i].min_age_limit,
                  jsonOptions[j].sessions[i].vaccine,
                  jsonOptions[j].sessions[i].available_capacity, jsonOptions[j].fee_type
                );
                // rowData.push({
                //         "address": jsonOptions[j].address,
                //         "pincode": jsonOptions[j].pincode,
                //         "vaccine": jsonOptions[j].sessions[i].vaccine,
                //         "available_capacity": jsonOptions[j].sessions[i].available_capacity,
                //         "min_age_limit": jsonOptions[j].sessions[i].min_age_limit
                // });
                let style = 'background: #f8f8f8;';
                let paid = ''
                if(jsonOptions[j].fee_type == "Paid"){
                  style = "background: wheat;"
                  let vaccineFee = 0;
                  for(let v in jsonOptions[j].vaccine_fees){
                    let vObj = jsonOptions[j].vaccine_fees[v];
                    if(vObj.vaccine == jsonOptions[j].sessions[i].vaccine){
                      vaccineFee = vObj.fee;
                    }
                  }
                  paid = "<span class='paid'><i class='fas fa-rupee-sign'></i> " + vaccineFee + "</span>";
                }
                $("#table-row-content").append(
                  `<tr style='`+style+`'>
                            <td scope="row" data-label="Address">` +
                    jsonOptions[j].name + `</br> ` +
                    jsonOptions[j].address + 
                    `</td>
                            <td data-label="Pincode"><a href="https://www.google.com/maps/place/` +
                    jsonOptions[j].pincode +
                    `" target="_blank">` +
                    jsonOptions[j].pincode + 
                    `</a></br>` + paid +
                    `</td>
                    <td data-label="Vaccination">` +
                    jsonOptions[j].sessions[i].vaccine +
                    `</td>
                            <td data-label="Dose1">` +
                    jsonOptions[j].sessions[i].available_capacity_dose1 +
                    `</td>
                            <td data-label="Dose2">` +
                    jsonOptions[j].sessions[i].available_capacity_dose2 +
                    `</td>
                            <td data-label="Age Limit">` +
                    ((jsonOptions[j].sessions[i].min_age_limit == "18") ? "18-44" : "45") +
                    `</td>
                            <td data-label="Date / Time">` +
                    jsonOptions[j].sessions[i].date +
                    ` <span class="time">(` +
                    tConvert(jsonOptions[j].from) +
                    ` - ` +
                    tConvert(jsonOptions[j].to) +
                    `)</span)</td>
                            </tr>`
                );
                // gridOptions.api.setRowData(rowData);
                dataCount++;
              } else {
                console.log(
                  "no vaccine for given criteria",
                  basil.get("age-group")
                );
              }
            } else if (
              jsonOptions[j].sessions[i].available_capacity == 0 &&
              !isDoseAvailable
            ) {
              $("#ag-grid-container").hide();
              // $("#table-row-content").empty();
              notifyResult("no dose available");
            }
          }
        }
        if (dataCount > 0) {
          audio.play();
        }
        $("#query").append(query);
        $("#query-container").show();
      }
    }
  };
  notifyResult("Loading...");
  // Set up and make the request.
  request.open("GET", srvUrl + district_id + "&date=" + dateFormat + "", true);
  request.send();
};

updateStates = function () {
  var dataList = document.getElementById("state-datalist");
  // var input = document.getElementById('state');

  // Create a new XMLHttpRequest.
  var request = new XMLHttpRequest();

  // Handle state changes for the request.
  request.onreadystatechange = function (response) {
    notifyResult("", true);
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
        notifyResult("Select State ... default search is for Pune");
      } else {
        // An error occured :(
        notifyResult("Couldn't load states :(");
      }
    }
  };

  // Update the placeholder text.
  notifyResult("Loading...");

  // Set up and make the request.
  request.open(
    "GET",
    "https://cdn-api.co-vin.in/api/v2/admin/location/states",
    true
  );
  request.send();
};

updateQuery = () => {
  var distList = document.getElementById("dist-datalist");
  var ageGroup = document.getElementById("age-group");
  var vaccineType = document.getElementById("vaccine-type");
  var dosePeriod = document.getElementById("dose-period");
  var payment = document.getElementById("payment");
  var stateList = document.getElementById("state-datalist");
  var distList = document.getElementById("dist-datalist");
  district_id = distList.selectedOptions[0].value;

  basil.set("state-datalist", stateList.selectedOptions[0].value);
  basil.set("dist-datalist", district_id);
  basil.set("age-group", ageGroup.selectedOptions[0].value);
  basil.set("vaccine-type", vaccineType.selectedOptions[0].value);
  basil.set("dose-period", dosePeriod.selectedOptions[0].value);
  basil.set("payment", payment.selectedOptions[0].value);
  query =
    stateList.selectedOptions[0].innerText +
    " | " +
    distList.selectedOptions[0].innerText +
    " | " +
    vaccineType.selectedOptions[0].innerText +
    " | " +
    ageGroup.selectedOptions[0].innerText +
    " | " +
    dosePeriod.selectedOptions[0].innerText +
    " | " +
    payment.selectedOptions[0].innerText;
  console.log("query", query);
};

updateSearch = function () {
  updateQuery();
  search(true);
};

updateDist = function (state) {
  notified = false;
  state_id = state ? state : $("#state-datalist").val();
  var distList = document.getElementById("dist-datalist");

  // Create a new XMLHttpRequest.
  var request = new XMLHttpRequest();

  // Handle state changes for the request.
  request.onreadystatechange = function (response) {
    notifyResult("", true);
    $("#dist-datalist").empty();
    const empOption = new Option("", "");
    // add it to the list
    distList.add(empOption, undefined);
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
        notifyResult("Select District");
        distList.focus();
      } else {
        // An error occured :(
        notifyResult("Couldn't load states :(");
      }
    }
  };

  // Update the placeholder text.
  notifyResult("Loading...");

  // Set up and make the request.
  request.open(
    "GET",
    "https://cdn-api.co-vin.in/api/v2/admin/location/districts/" + state_id,
    true
  );
  request.send();
};

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
  rowBuffer: 5,
  sideBar: ["columns", "filters"],
  rowData: rowData,
};

// setup the grid after the page has finished loading
document.addEventListener("DOMContentLoaded", () => {
  $("#ag-grid-container").hide();
  $("#filter-container").hide();
  notifyResult("Default Search is for Pune :");
  // if (!Notification) {
  //   alert("Desktop notifications not available in your browser. Try Chromium.");
  //   return;
  // }

  basil.keys().forEach(function (key) {
    if ($("#" + key)) {
      console.log(key, basil.get(key));
      if ("state-datalist" == key) {
        state_id = basil.get(key);
        console.log("Load n set dist", $("#" + key).val());
        const promiseA = new Promise((resolve, reject) => {
          updateDist(state_id);
        });
        // At this point, "promiseA" is already settled.
        promiseA.then((val) =>
          console.log("asynchronous logging has val:", val)
        );
      }
      setTimeout(function () {
        $("#" + key).val(basil.get(key));
      }, 500);
    }
  });
  $("#query-container").hide();
  $("#filter-hide").hide();
  // if (Notification && Notification.permission !== "granted") Notification.requestPermission();
});

const instervalSearch = (e) => {
  if (!activeInterval) {
    activeInterval = true;
    updateQuery();
    search(true);
    setInterval(function () {
      updateQuery();
      search(true);
    }, 10000);
    // audio.play();
    notifyResult(
      "You will hear this sound when slot is open... do not close browser window / tab. refresh page to stop watch on open slots..."
    );
    e.textContent = "Notification On";
    e.className = "orange";
  } else {
    audio.play();
    notifyResult(
      "You will hear this sound when slot is open... do not close browser window / tab. refresh page to stop watch on open slots..."
    );
  }
};

function notifyMe(txt) {
  return;
  // if (Notification && Notification.permission !== "granted") Notification.requestPermission();
  // else {
  //   var notification = new Notification("COWIN Slot available", {
  //     icon: "https://latitudes.in/images/logo/latitudes_round_logo_small.png",
  //     body: txt,
  //   });
  //   notification.onclick = function () {
  //     window.open("https://selfregistration.cowin.gov.in/dashboard");
  //   };
  // }
}

const notifyResult = (txt, hide) => {
  if (hide) {
    $("#result").hide();
    return;
  }
  $("#result").show();
  $("#result").empty();
  $("#result").append(txt);
  setTimeout(function () {
    $("#result").hide();
  }, 15000);
};

const showMainFilter = () => {
  if (hideFilter) {
    $("#query-container").show();
    $("#main-filter").hide();
    $("#filter-show").hide();
    $("#filter-hide").show();
    hideFilter = false;
    $("#main-filter-btn")[0].textContent = "Show Filter";
  } else {
    hideFilter = true;
    $("#main-filter-btn")[0].textContent = "Hide Filter";
    $("#filter-hide").hide();
    $("#filter-show").show();
    $("#main-filter").show();
  }
};


$(document).ready(function(){
  $("#global-search").on("keyup", function() {
    var value = $(this).val().toLowerCase();
    $("#table-row-content tr").filter(function() {
      $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
    });
  });
});