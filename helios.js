/*
ioBroker-Helios-KWL
IMPORTANT: This script requires at least JavaScript adapter v7.9.0!
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

// Create states from parameter names
for (let param in datapoint_names) {
    // Different defaults for different datapoints
    if (param === "w00090") {
        createState(datapoint_prefix + "." + datapoint_names[param], "0;10;4");
        continue;
    }

    if (param === "w00101") {
        createState(datapoint_prefix + "." + datapoint_names[param], 0);
        continue;
    }

    // No default given
    createState(datapoint_prefix + "." + datapoint_names[param]);
}

// Login every 5 minutes
setInterval(function () {
    let path = "info.htm";
    let body = "v00402=" + helios_password;

    httpPost(path, body, {headers: {"Content-Length": body.length.toString()}}, () => {
    });
}, 300000);

// Refresh values
setInterval(function () {
    // Load and refresh values from different XML-files (default: page 4 and page 8. Can be extended from 1 to 17 to obtain everything)
    const xmlPages = [4, 8];
    xmlPages.forEach(function (page) {
        let path = "http://" + helios_ip + "/data/werte" + page + ".xml";
        let body = "xml=/data/werte" + page + ".xml";

        httpPost(path, body, {headers: {"Content-Length": body.length.toString()}}, (_, response) => {
            refreshValues(response.data);
        });
    });
}, refresh_interval * 1000);

// Read XML response, extract IDs and values, refresh states with new values
function refreshValues(xml) {
    const regex = /<ID>(?<ID>v\d{5})<\/ID>\s*?<VA>(?<VALUE>.*?)<\/VA>/gm;
    const elements = xml.matchAll(regex);

    for (let element of elements) {
        let {ID, VALUE} = element.groups;
        let NAME = datapoint_names[ID];

        // Only refresh values that we have names for
        if (NAME === undefined)
            continue;

        setState(datapoint_prefix + "." + NAME, VALUE);
    }
}

// Takes an URL-path and multiple registers with values to set values and change settings
function setValues(page) {
    const args = arguments;
    const arrayValues = [];
    for (let i = 1; i < args.length; i++) {
        arrayValues.push(args[i]);
    }

    let path = "http://" + helios_ip + "/" + page + ".htm";
    let body = arrayValues.join("&");

    httpPost(path, body, {headers: {"Content-Length": body.length.toString()}}, () => {
    });
}

// Set fan speed
function setFanSpeed(speed) {
    // Check if wanted fan speed is a reasonable value
    if (0 <= speed && speed <= 4) {
        setValues("info", "v00102=" + speed);
        return;
    }

    setFanSpeed(0);
}

// If specified fan speed was changed, then set fan speed accordingly
on({id: "javascript.0." + datapoint_prefix + "." + datapoint_names["w00102"], change: "any"}, async function (obj) {
    const value = obj.state.val;
    setFanSpeed(value);
});

// Set party mode using following scheme:
// onOff;duration;speed, e.g.
// "1;10;4" = turn on party mode for 10 minutes and set fan speed to 4
// "2;10;4" = invalid
// "0;10;4" = turn off party mode
let Timer_Partymode;

function setPartyMode(onOff, duration, speed) {
    const isOnOffValid = 0 <= onOff && onOff <= 1;
    const isDurationValid = 0 < duration && duration <= 180;
    const isSpeedValid = 0 <= speed && speed <= 4;

    // Only allow reasonable values
    if (!isOnOffValid || !isDurationValid || !isSpeedValid)
        return;

    // Clear old timer
    clearStateDelayed("javascript.0." + datapoint_prefix + "." + datapoint_names["w00102"], Timer_Partymode);

    // use setFanSpeed() to set desired speed
    setFanSpeed(speed);

    // if desired speed was 0 then the fan is already turned off...
    if (speed === 0)
        return;

    // ...but if it was above 0 then we have to set it back to 0 after [duration] minutes
    Timer_Partymode = setStateDelayed("javascript.0." + datapoint_prefix + "." + datapoint_names["w00102"], 0, duration * 60000, true);
}

// If specified party mode was changed, then mode accordingly
on({id: "javascript.0." + datapoint_prefix + "." + datapoint_names["w00090"], change: "any"}, async function (obj) {
    const value = obj.state.val;
    const values = value.split(";");
    setPartyMode(parseInt(values[0], 10), parseInt(values[1], 10), parseInt(values[2], 10));
});

// Set operating mode
function setOperatingMode(onOff) {
    // Only allow reasonable values
    const isOnOffValid = 0 <= onOff && onOff <= 1;
    if (!isOnOffValid)
        return;

    setValues("info", "v00101=" + onOff);
}

// If specified party mode was changed, then mode accordingly
on({id: "javascript.0." + datapoint_prefix + "." + datapoint_names["w00101"], change: "any"}, async function (obj) {
    const value = obj.state.val;
    setOperatingMode(value);
});

// Reset change interval of filter every month
schedule("0 5 1 * *", function () {
    setValues("gear", "v01034=1");
});


// ADDITIONAL SCRIPTS (see github.com/KLVN/ioBroker_Helios-KWL) ////////////

// ...insert additional scripts here