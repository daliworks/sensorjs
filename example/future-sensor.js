'use strict';

// NOTE: sensorjs-futuretek is required (npm install sensorjs-futuretek)
var connect = require('../'),
    sensorApp = connect.sensor,
    futureSensor = require('sensorjs-futuretek'),
    futureNetwork;

sensorApp.addSensorPackage(futureSensor);
futureNetwork = sensorApp.getNetwork('future');

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

futureNetwork.discover(function (err, devices) {
  devices.forEach(function (device) {
    device.sensorUrls.forEach(function (sensorUrl) {
      app.listen(sensorApp.createSensor(sensorUrl));
    });
  });
});
