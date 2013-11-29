'use strict';
var sense = require('sensorjs').sense,
    sensor = require('sensorjs').sensor;

var temperatureApp = sense().
  use(sense.query({$between: [-50, 50]})). // filter: passing between -50 and 50
  use(sense.average(5 /*duration*/)).      // reduce: values to an average every 5 sec.
  use(sense.queue(100)).                   // buffering max # of 100.
  use(function (req, next) {               // custom middleware
    if (Math.max.apply(null, req.queue) < req.value) {
      req.hint = 'new record';
    } 
    next();
  }).
  //transport(mqtt, localStorage, websocket and etc)
  use(sense.websocket('http://yourhost.com', 'temperature/{id}'/*topic*/));

sensor.discover('oneWire'/*sensor network*/, function (err, ids) {
  ids.forEach(function (id) {
    temperatureApp.listen(sensor.createSensor('ds18b20', id));
  });
});

