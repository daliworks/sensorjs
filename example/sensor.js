'use strict';
var sensorjs = require('sensorjs'),
  sensor = sensorjs.sensor,
  filter = sensorjs.filter,
  channel = sensorjs.channel;

var thermometer = sensor('ds18b20'/*driver name*/, 'temp1'/*id*/);

thermometer.use(filter.gt(20));           // passing when sensor value is >20 
thermometer.use(filter.noError());        // passing non-error
thermometer.use(function (data, next) {   // custom connector implements filter.gt(20)
  if (data.value > 20) {
    next();
  } else {
    next(new Error('filtering low value'));
  }
});

thermometer.use(channel.mqttChannel('temp1')); 
thermometer.listen();
