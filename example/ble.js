'use strict';
var connect = require('sensorjs'),
   sensor = connect.sensor,
   ble = sensor.createNetwork('ble');

var app = connect().
  use(connect.filter({$between: [-50, 50]})). // filter: passing between -50 and 50
  use(connect.average(5 /*duration*/)).      // reduce: values to an average every 5 sec.
  use(connect.queue(100)).                   // buffering max # of 100.
  use(function (data, next) {                // custom middleware
    if (Math.max.apply(null, data.queue) < data.value) {
      data.hint = 'new record';
    } 
    next();
  }).
  // transport(mqtt, localStorage, websocket and etc)
  use(connect.websocket('http://yourhost.com', 'temperature/{id}'/*topic*/));

ble.discover('PXP'/* sensor driver name(or profile name) */, function (err, devices) {
  devices.forEach(function (device) {
    if (device.sensors) {
      device.connect();
      var thermometer = device.createSensor(device.sensors[0] );

      // listen to sensor data
      app.listen(thermometer);
    }
  });
});

var device = ble.createDevice('addr');
device.connect();
device.createSensor('sensorid');
