'use strict';
var _ = require('lodash');

exports = module.exports = {};
var app = exports;

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
  var stack = this.stack,
  index = 0,
  path = req.path ? req.path : '/';

  function next(err) {
    var layer = stack[index++];

    if(!layer) { //done
      return out && out(err);
    }

    try {
      var pathArr = path && path.toLowerCase().split('/'),
        routeArr = layer.route !== '/' && layer.route.toLowerCase().split('/');

      if (routeArr && !_.all(routeArr, function (route, idx) {
          return (route === '*' || route === pathArr[idx]); 
        })) {
        return next(err);
      }
      var arity = layer.handle.length;
      if (err) {
        if (arity === 3) {
          layer.handle(err, req, next);
        } else {
          next(err);
        }
      } else if (arity < 3) {
        layer.handle(req, next);
      } else {
        next();
      }
    } catch (e) {
      next(e);
    }
  }
  next();
};

app._handler = function(sensor, data, cache) {
  var info = sensor.info,
      req;

  req = { 
    id: sensor.id,
    type: data.result && _.keys(data.result)[0],
    time: Date.now(),
    value: data.result && _.values(data.result)[0],
    status: data.status,
    message: data.message,
    path: ['', info.device.sensorNetwork, info.device.address, info.model, info.id].join('/')
  };
  
  if (cache[req.id]) { //Note: id should be unique.
    req = _.assign(cache[req.id], req);
  } else {
    cache[req.id] = req;
  }

  this.handle(req, function (err) {
    if (err) {
      console.error('err', err);
    }
  });
};

app.listen = function (sensors) {
  var self = this;
  if (!_.isArray(sensors)) {
    sensors = [ sensors ];
  }
  _.each(sensors, function (sensor) {
    var props = sensor.getProperties();
    if (props && props.onChange) {
      sensor.listen('change');
      sensor.on('change', function (data) {
        self._handler(this, data, self.cache);
      });
    } else {
      sensor.listen();
      sensor.on('data', function (data) {
        self._handler(this, data, self.cache);
      });
    }
  });
};
