// SCHEDULES ///////////////////////////////////////////////////////////////

// Daily schedule (night): Set fan speed to 2 at 23:00 (and every 30 minutes until 5:30 so it will automatically reset, if a user changes the value)
schedule('{"time":{"start":"22:59","end":"00:00","mode":"minutes","interval":30},"period":{"days":1}}', function () {
  setState(datapoint_prefix + "." + datapoint_names["w00102"], 2)
});
schedule('{"time":{"start":"00:01","end":"05:58","mode":"minutes","interval":30},"period":{"days":1}}', function () {
  setState(datapoint_prefix + "." + datapoint_names["w00102"], 2)
});

/* During the day set fan speed back to 0 if the last change was 20 minutes ago.
   Users are able to set a fan speed but ventilation system will turn off (fan speed = 0) automatically after 20 minutes
   to ensure it's not running all day long.
*/
schedule('{"time":{"start":"05:59","end":"22:58","mode":"minutes","interval":1},"period":{"days":1}}', function () {
  const currentState = getState(datapoint_prefix + "." + datapoint_names["w00102"]);
  const currentValue = currentState["val"];
  const lastChanged = currentState["lc"];
  const now = Date.now();

  // If fan speed was changed 20 minutes ago, then set fan speed to 0
  if (((now - 20 * 60000) > lastChanged) && currentValue != 0) {
    setState(datapoint_prefix + "." + datapoint_names["w00102"], 0);
  }
});


// SCHEDULES (with presence awareness) /////////////////////////////////////

/* If you have a state that counts all people at home, you can use this additional condition to turn off the
   ventilation system/schedule if nobody is there.
*/
schedule('{"time":{"start":"22:59","end":"00:00","mode":"minutes","interval":30},"period":{"days":1}}', function () {
  if (getState("INSERT_STATE_OF_PEOPLE_COUNTER")["val"] > 0) {
    setState(datapoint_prefix + "." + datapoint_names["w00102"], 2);
  } else {
    setState(datapoint_prefix + "." + datapoint_names["w00102"], 0);
  }
});
schedule('{"time":{"start":"00:01","end":"05:58","mode":"minutes","interval":30},"period":{"days":1}}', function () {
  if (getState("INSERT_STATE_OF_PEOPLE_COUNTER")["val"] > 0) {
    setState(datapoint_prefix + "." + datapoint_names["w00102"], 2);
  } else {
    setState(datapoint_prefix + "." + datapoint_names["w00102"], 0);
  }
});