'use strict';
var connect = require('sensorjs'),
   sensor = require('sensorjs').sensor;

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
  use(function (data, next) {
    if (data.driver === 'ds18b20') {
      if (data.value > 30) {
        data.message = 'too hot';  
      }
      next();
    } else if (data.driver === 'dht11') {
      if (data.value < 20) {
        data.message = 'too dry';  
      }
      next();
    } else {
      next(new Error('this will not connect to websocket below'));
    }
  }).
  // transport(mqtt, localStorage, websocket and etc)
  use(connect.websocket('http://yourhost.com', 'temperature/{id}'/*topic*/));

sensor.discover('oneWire'/*sensor network*/, function (err, ids) {
  ids.forEach(function (id) {
    var thermometer = sensor.createSensor('ds18b20', id);

    app.listen(thermometer);
  });
});
sensor.discover('gpio', function (err, ids) {
  ids.forEach(function (id) {
    var hygrometer = sensor.createSensor('dht11', id);
    app.listen(hygrometer);
  });
});
