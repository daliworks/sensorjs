'use strict';
var connect = require('../'),
   sensor = connect.sensor,
   oneWire = sensor.createNetwork('oneWire');
   
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

oneWire.discover('ds18b20'/* sensor driver name */, function (err, devices) {
  devices.forEach(function (device) {
    var thermometer = sensor.createSensor(device);

    // listen to sensor data for connecting 
    app.listen(thermometer);
  });
});
