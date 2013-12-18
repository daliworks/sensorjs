'use strict';
var sensorDriver = require('../').sensor;

sensorDriver.discover('ds18b20'/* sensor driver name */, function (err, devices) {
  devices.forEach(function (device) {
    device.sensors.forEach(function (sensorInfo) {
      //device.connect(); //auto
      var thermometer = sensorDriver.createSensor(sensorInfo); 
      thermometer.get(function (err, data) {
        if (!err) {
          console.log(data);
        } 
      });
    });
  });
});

var therm = sensorDriver.createSensor('url');
therm.get(function (err, data) {
  console.log(data);
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
