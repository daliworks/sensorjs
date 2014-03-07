'use strict';
var sensorDriver = require('../').sensor;

var url = 'sensorjs:///uart/1/gps/gps1';
var loc = sensorDriver.createSensor(url, {baudRate: 9600});
loc.listen();
loc.on('data', function (data) {
  console.log(url, data);
});
