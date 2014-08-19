/* jshint strict: true */
/* global console, require  */

// NOTE: sensorjs-futuretek is required (npm install sensorjs-futuretek)
var connect = require('../'),
    sensorApp = connect.sensor,
    futureSensor = require('sensorjs-futuretek');

sensorApp.addSensorPackage(futureSensor);

sensorApp.discover('futureSensor', function (err, devices) {
  'use strict';

  console.log('discovered devices', devices, err);

  devices.forEach(function (device) {
    device.sensorUrls.forEach(function (sensorUrl) {
      var sensor, parsedSensorUrl, props;

      sensor = sensorApp.createSensor(sensorUrl);

      parsedSensorUrl = sensorApp.parseSensorUrl(sensorUrl);

      props = sensorApp.getSensorProperties(parsedSensorUrl.model);

      if (props.onChange) {
        sensor.on('change', function (data) {
          console.log('[[future sensor]] on change - data', data);
        });

        sensor.listen('change');
      } else {
        sensor.on('data', function(data) {
          console.log('[[future sensor]] sensor data', data);
        });

        sensor.listen();
      }
    });
  });
});
