'use strict';
var _ = require('lodash');

var app = module.exports = {};

app.use = function (route, fn) {
  if ('string' !== typeof route) {
    fn = route;
    route = '/';
  }
  if ('function' === typeof fn) {
    this.stack.push({route: route, handle: fn});
  }
  return this;
};

app.handle = function (req, out) {
  var stack = app.stack,
  index = 0,
  path = req.path ? req.path : '/';

  function next(err) {
    var layer = stack[index++];

    if(!layer) { //done
      return out && out(err);
    }

    try {
      if (path.toLowerCase().indexOf(layer.route.toLowerCase()) !== 0) {
        return next (err);
      }
      var arity = layer.handle.length;
      if (err && arity === 3) {
        layer.handle(err, req, next);
      } else if (arity < 3) {
        layer.handle(req, next);
      } else {
        next(err);
      }
    } catch (e) {
      next(e);
    }
  }
  next();
};


function _handler(sensor, data) {
  var network = sensor.options.network || sensor.properties.supportedNetwork[0],
  req = { 
    id: sensor.id,
    time: Date.now(),
    value: data.value,
    path: '/' + network + '/' + sensor.model,
  };

  app.handle(req, function (err) {
    //default error handle?
    console.error('err', err);
  });
}

app.listen = function (sensors) {
  if (!_.isArray(sensors)) {
    sensors = [ sensors ];
  }
  _.each(sensors, function (sensor) {
    if (sensor.properties.onChange) {
      sensor.listen('change');
      sensor.on('change', function (data) {
        _handler(this, data);
      });
    } else {
      sensor.listen();
      sensor.on('data', function (data) {
        _handler(this, data);
      });
    }
  });
};
