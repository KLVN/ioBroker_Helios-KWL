// BATHROOM VENTILATION ////////////////////////////////////////////////////
/* I'm monitoring my power consumption and have an instant water heater that consumes a lot of electrical power to heat water.
   During showers the consumption settles around 6.5 kW and therefore this script will query the count of all values in the last
   three minutes that exceeded 6 kW and turn on the ventilation system for the next 15 minutes. Because I'm logging my consumption
   every 10 seconds there will be a maximum of 18 values in three minutes and the threshold is set to 14 values for a bit of
   tolerance. This helps me avoiding fogged up mirrors and surfaces and mitigates mold and moisture.
   
   Initially I was querying the mean value but this led to false positives because e.g. washing hands, what happens pretty often
   during COVID-19, consumes a lot of power (~14 kW) for a very short duration so that the mean surpassed the given threshold.
   Because only the overall power consumption is taken into account there still may be false positives, e.g. during cooking with multiple
   (electrical) stove plates or using many high-power devices simultaneously (hair dryer, vacuum cleaner, dish washer, washing machine, ...).

   Requirements:
     - Measurement for electrical power consumption
     - InfluxDB
     - Ventilation system
     - Electrical instant water heater / flow heater

*/

setInterval(function () {
    sendTo("influxdb.0", "query", 'SELECT count("value") FROM "INSERT_STATE_OF_POWER_CONSUMPTION" WHERE time >= now() - 3m AND value >= 6000', function (result) {
        if (result.error) {
            console.error(result.error);
            return;
        }

        if (result["result"][0].length < 1)
            return;

        const countAboveThreshold = result["result"][0][0]["count"];

        // If there are less than 14 values above 6kW in the last three minutes (see query), then skip
        if (countAboveThreshold < 14)
            return;

        // else set fan speed to 4
        setState(datapoint_prefix + "." + datapoint_names["w00102"], 4);
        // and after 15 minutes set fan speed to 0
        setStateDelayed(datapoint_prefix + "." + datapoint_names["w00102"], 0, 15 * 60000, true, function () {
            console.log("VENTILATION: Ventilation was turned off 15 minutes after showering");
        });

    });
}, 180000);