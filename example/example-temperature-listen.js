'use strict';
var connect = require('../'),
   sensorDriver = connect.sensor;

var app = connect().
  use(connect.filter({$between: [-50, 50]})). // filter: passing between -50 and 50
  use(connect.average(20 /*duration*/)).      // reduce: values to an average every 5 sec.
  use(function (data, next) {                // custom middleware
    if (Math.max.apply(null, data.queue) < data.value) {
      console.log('new record', data.value);
    } 
    next();
  }).
  use(connect.queue(100));                   // buffering max # of 100.
  // transport(mqtt, localStorage, websocket and etc)
  //use(connect.websocket('http://yourhost.com', 'temperature/{id}'/*topic*/));

sensorDriver.discover('ds18b20'/* sensor driver name */, function (err, devices) {
  devices.forEach(function (device) {
    device.sensorUrls.forEach(function (sensorUrl) {
      var thermometer = sensorDriver.createSensor(sensorUrl);

      // listen to sensor data for connecting 
      app.listen(thermometer);
    });
  });
});
