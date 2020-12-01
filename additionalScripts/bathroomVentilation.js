// BATHROOM VENTILATION ////////////////////////////////////////////////////
/* I'm monitoring my power consumption and have an instant water heater that consumes a lot of electrical power to heat water.
   During showers the consumption settles around 6.5 kW and therefore this script will look for the mean power consumption in
   the last 5 minutes and turn on the ventilation system for the next 15 minutes if it exceeds 6 kW.
   This helps me avoiding fogged up mirrors and surfaces and mitigates mold and moisture.
   Because only the overall power consumption is taken into account there may be false positives, e.g. during cooking with multiple
   (electrical) stove plates or using many high-power devices simultaneously (hair dryer, vacuum cleaner, dish washer, washing machine, ...)

   Requirements:
     - Measurement for electrical power consumption
     - InfluxDB
     - Ventilation system
     - Electrical instant water heater / flow heater

*/

setInterval(function () {
  sendTo("influxdb.0", "query", 'SELECT mean("value") FROM "INSERT_STATE_OF_POWER_CONSUMPTION" WHERE time >= now() - 5m GROUP BY time(5m) fill(none)', function (result) {
    if (result.error) {
      console.error(result.error);
    } else {
      var lastAverages = result.result[0];
      var lastAverage = lastAverages[lastAverages.length - 1]["mean"];

      // If mean power consumption in the last 5 minutes was above 6 kilowatts
      if (lastAverage >= 6000) {
        // then set fan speed to 4
        setState(datapoint_prefix + "." + datapoint_names["w00102"], 4);
        // and after 15 minutes set fan speed back to 0
        setStateDelayed(datapoint_prefix + "." + datapoint_names["w00102"], 0, 15 * 60000, true, function () {
          console.log('VENTILATION: Ventilation was turned off 15 minutes after showering');
        });
      }
    }
  }
  );
}, 310000);