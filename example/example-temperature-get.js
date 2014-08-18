'use strict';
var sensorApp = require('../').sensor;

sensorApp.discover('ds18b20'/* sensor driver name */, function (err, devices) {
  devices.forEach(function (device) {
    device.sensorUrls.forEach(function (sensorUrl) {
      //device.connect(); //auto
      var thermometer = sensorApp.createSensor(sensorUrl);
      thermometer.get(function (err, data) {
        if (!err) {
          console.log(data);
        } 
      });
    });
  });
});

sensorApp.getNetwork('w1').discover(null/* sensor driver name */, function (err, devices) {
  devices.forEach(function (device) {
    device.sensorUrls.forEach(function (sensorUrl) {
      //device.connect(); //auto
      var thermometer = sensorApp.createSensor(sensorUrl);
      thermometer.get(function (err, data) {
        if (!err) {
          console.log(data);
        } 
      });
    });
  });
});

var url = 'sensorjs:///w1/28-000003a7f590/ds18b20/28-000003a7f590';
var therm = sensorApp.createSensor(url);
therm.get(function (err, data) {
  console.log(url, data);
});

//url
/**
 * sensorjs:///{sensor network}[:{bus_id}]/{addr}/{model}/{instance id}
 * sensorjs:///gpio/22/dht11 --> uuid: model + gatewayId
 * sensorjs:///i2c/222/dht22 --> uuid: model + gatewayId
 * sensorjs:///ble/1122334455/PXP --> uuid address+model
 * sensorjs:///w1/28-xxx/ds18b20 --> uuid : address
 * sensorjs:///uart/1ds18b20 --> uuid : address
 */
