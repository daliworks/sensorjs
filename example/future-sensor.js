'use strict';
var connect = require('../'),
   sensorDriver = connect.sensor,
   future = sensorDriver.getNetwork('future');

var app = connect().
  use('/future/*/futureTemp',function (data, next) { // custom middleware
    console.log('Temp=', data.value);
    next();
  }).
  use('/future/*/futureHumi',function (data, next) { // custom middleware
    console.log('Humi=', data.value);
    next();
  }).
  use(connect.queue(100));                   // buffering max # of 100.

future.discover(function (err, devices) {
  devices.forEach(function (device) {
    device.sensorUrls.forEach(function (sensorUrl) {
      app.listen(sensorDriver.createSensor(sensorUrl));
    });
  });
});
