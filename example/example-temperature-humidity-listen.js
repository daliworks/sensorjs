'use strict';
var connect = require('../'),
   sensorDriver = connect.sensor;

var app = connect().
  use(connect.filter({$between: [-50, 50]})). // filter: passing between -50 and 50
  use(connect.average(20 /*duration*/)).     // reduce: values to an average every 20 sec.
  use(function (data, next) {                // custom middleware
    if (Math.max.apply(null, data.queue) < data.value) {
      console.log('new record', data.value);
    } 
    next();
  }).
  use(connect.queue(100)).                   // buffering max # of 100.
  use('/w1/*/ds18b20', function (data, next) {
    if (data.value > 20) {
      console.log('getting hot:', data.value);
    }
    next();
  }).
  use('/gpio/*/dht11', function (data, next) {
    if (data.value < 30) {
      console.log('getting dry:', data.value);
    }
    next();
  });
  // transport(mqtt, localStorage, websocket and etc)
  //use(connect.websocket('http://yourhost.com', 'temperature/{id}'/*topic*/));

sensorDriver.discover('ds18b20'/*sensor network*/, function (err, devices) {
  devices.forEach(function (device) {
    device.sensorUrls.forEach(function(sensorUrl) {
      app.listen(sensorDriver.createSensor(sensorUrl));
    });
  });
});
// gpio is not discoverable
var dhtUrl = 'sensorjs:///gpio/22/dht11/dht11';
app.listen(sensorDriver.createSensor(dhtUrl));
