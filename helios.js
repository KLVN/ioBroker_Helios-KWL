/*
ioBroker-Helios-KWL
IMPORTANT: This script requires at least Node.js v12.x!
https://github.com/KLVN/ioBroker_Helios-KWL
*/

// SETTINGS ////////////////////////////////////////////////////////////////

const helios_ip = "192.xxx.xxx.xxx";    // IP of Helios KWL
const helios_password = "!helios!";     // Password of Helios KWL (default)
const datapoint_prefix = "HeliosKWL";   // Prefix for datapoints, e.g. HeliosKWL.Temperatur_Zuluft
const refresh_interval = 10;            // Refresh every x seconds

const datapoint_names = {
  "w00090": "Partybetrieb_SOLL",        // on/off;duration;speed
  "v00101": "Betriebsart_IST",          // Operating mode (manual = 1, automatic = 0)
  "w00101": "Betriebsart_SOLL",         // Custom variable for operating mode (manual = 1, automatic = 0)
  "v00102": "Luefterstufe_IST",         // Fan speed
  "w00102": "Luefterstufe_SOLL",        // Custom variable for fan speed
  "v00104": "Temperatur_Aussenluft",    // Temperature outdoor air sensor
  "v00105": "Temperatur_Zuluft",        // Temperature supply air sensor
  "v00106": "Temperatur_Fortluft",      // Temperature exhaust air sensor
  "v00107": "Temperatur_Abluft"         // Temperature extract air sensor
  // "Register": "Name for the datapoint" (I'm using "vxxxxx" for actual registers and "wxxxxx" for custom datapoints)
}

////////////////////////////////////////////////////////////////////////////

// Not necessary; already defined in ioBroker
// var request= require('request');

// Returns a matching header for login and XML-files
function createHeader(ip, url, body) {
  var header = {
    headers: {
      "Accept": "*/*",
      "Accept-Encoding": "gzip, deflate",
      "Accept-Language": "de,en-US;q=0.7,en;q=0.3",
      "Connection": "keep-alive",
      "Content-Length": "15",
      "Content-Type": "text/plain;charset=UTF-8",
      "DNT": "1",
      "Referer": "http://" + ip + "/",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.193 Safari/537.36",
      "Host": ip
    },
    url: "http://" + ip + "/" + url,
    body: body,
    method: "POST"
  }
  return header
}

// Create states from parameter names
for (let param in datapoint_names) {
  // Different defaults for different datapoints
  if (param == "w00090") {
    createState(datapoint_prefix + "." + datapoint_names[param], "0;10;4");
  } else if (param == "w00101") {
    createState(datapoint_prefix + "." + datapoint_names[param], 0);
  } else {
    // No default given
    createState(datapoint_prefix + "." + datapoint_names[param]);
  }
}

// Login every 5 minutes
setInterval(function () {
  request(createHeader(helios_ip, "info.htm", "v00402=" + helios_password));
}, 300000);

// Refresh values
setInterval(function () {
  // Load and refresh values from different XML-files (default: page 4 and page 8. Can be extended from 1 to 17 to obtain everything)
  const xmlPages = [4, 8];
  xmlPages.forEach(function (page, index) {
    request(createHeader(helios_ip, "data/werte" + page + ".xml", "xml=/data/werte" + page + ".xml"), function (error, response, result) {
      refreshValues(result);
    });
  });
}, refresh_interval * 1000);

// Read XML response, extract IDs and values, refresh states with new values
function refreshValues(xml) {
  const regex = /<ID>(?<ID>v\d{5})<\/ID>\s*?<VA>(?<VALUE>.*?)<\/VA>/gm;
  var elements = xml.matchAll(regex);

  for (let element of elements) {
    let { ID, VALUE } = element.groups;
    let NAME = datapoint_names[ID];

    // Only refresh values that we have names for
    if (NAME != undefined) {
      setState(datapoint_prefix + "." + NAME, VALUE);
    }
  }
}

// Takes an URL-path and multiple registers with values to set values and change settings
function setValues(path, values) {
  var args = arguments;
  var arrayValues = [];
  for (var i = 1; i < args.length; i++) {
    arrayValues.push(args[i]);
  }
  request(createHeader(helios_ip, path + ".htm", arrayValues.join("&")));
}

// Set fan speed
function setFanSpeed(speed) {
  // Check if wanted fan speed is a reasonable value
  if ([0, 1, 2, 3, 4].indexOf(speed) >= 0) {
    setValues("info", "v00102=" + speed);
  } else {
    setFanSpeed(0);
  }
}
// If specified fan speed was changed, then set fan speed accordingly
on({ id: "javascript.0." + datapoint_prefix + "." + datapoint_names["w00102"], change: "any" }, async function (obj) {
  var value = obj.state.val;
  setFanSpeed(value);
});

// Set party mode using following scheme:
// onOff;duration;speed, e.g.
// "1;10;4" = turn on party mode for 10 minutes and set fan speed to 4
// "2;10;4" = invalid
// "0;10;4" = turn off party mode
function setPartyMode(onOff, duration, speed) {
  // Only allow reasonable values
  if (([0, 1].indexOf(onOff) >= 0) && (duration > 0) && (duration <= 180) && ([0, 1, 2, 3, 4].indexOf(speed) >= 0)) {
    setValues("party", "v00094=" + onOff, "v00091=" + duration, "v00092=" + speed);
  }
}
// If specified party mode was changed, then mode accordingly
on({ id: "javascript.0." + datapoint_prefix + "." + datapoint_names["w00090"], change: "any" }, async function (obj) {
  var value = obj.state.val;
  var values = value.split(";");
  setPartyMode(parseInt(values[0], 10), parseInt(values[1], 10), parseInt(values[2], 10));
});

// Set operating mode
function setOperatingMode(onOff) {
  // Only allow reasonable values
  if ([0, 1].indexOf(onOff) >= 0) {
    setValues("info", "v00101=" + onOff);
  }
}
// If specified party mode was changed, then mode accordingly
on({ id: "javascript.0." + datapoint_prefix + "." + datapoint_names["w00101"], change: "any" }, async function (obj) {
  var value = obj.state.val;
  setOperatingMode(value);
});


// SCHEDULES ///////////////////////////////////////////////////////////////

// Daily schedule: Set fan speed to 2 at 23:00 (and every 30 minutes until 5:30 so it will automatically reset, if a user changes the value)
schedule('{"time":{"start":"23:00","end":"00:00","mode":"minutes","interval":30},"period":{"days":1}}', function () {
  setState(datapoint_prefix + "." + datapoint_names["w00102"], 2)
});
schedule('{"time":{"start":"00:01","end":"05:59","mode":"minutes","interval":30},"period":{"days":1}}', function () {
  setState(datapoint_prefix + "." + datapoint_names["w00102"], 2)
});

// Set fan speed to 0 at 6:00 (and every hour until 22:59)
schedule('{"time":{"start":"06:00","end":"22:59","mode":"hours","interval":1},"period":{"days":1}}', function () {
  setState(datapoint_prefix + "." + datapoint_names["w00102"], 0)
});

// Reset change interval of filter every month
schedule("0 5 1 * *", function () {
  setValues("gear", "v01034=1");
});