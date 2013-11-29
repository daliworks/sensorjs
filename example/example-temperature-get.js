'use strict';
var sensor = require('sensorjs').sensor;

sensor.discover('oneWire'/*sensor network*/, function (err, ids) {
  ids.forEach(function (id) {
    var thermometer = sensor.createSensor('ds18b20', id);

    thermometer.get(function (err, data) {
      if (!err) {
        console.log(data);
      } 
    });
  });
});
