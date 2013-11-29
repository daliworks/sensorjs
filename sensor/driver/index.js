'use strict';

var EventEmitter = require('events').EventEmitter,
  util = require('util'),
  sensors = require('../'),
  _ = require('lodash'),
  logger = require('log4js').getLogger('Sensor');

function template(str, tokens) {
  return str.replace(/\{(\w+)\}/g, function (x, key) {
    return tokens[key];
  });
}
function lower1stLetter(string)
{
  return string.charAt(0).toLowerCase() + string.slice(1);
}

/*
 * Sensor
 */
function Sensor(id, options) {
  var driverName = lower1stLetter(this.constructor.name);
  var props = this.properties = sensors.getSensorProperties(driverName);

  if (id) {
    this.id = id;
  } else {
    if (props && props.id) {
      this.id = template(props.id, options);
    }
  }
  this.options = options;

  EventEmitter.call(this);
}

util.inherits(Sensor, EventEmitter);

Sensor.properties = {};

// listen 'data' event once unless interval is provided and not zero.
// listen 'change' event if 'change' is provided
// previous listener stops before enabling new one.
Sensor.prototype.listen = function (intervalOrEvent) {
  var self = this,
    interval, change;

  if (intervalOrEvent) {
    if (typeof intervalOrEvent === 'number') {
      interval = intervalOrEvent;
    } else if (intervalOrEvent === 'change') {
      change = true;
    }
  }

  if (interval) {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.timer = setInterval(function () {
      self._get();
    }, interval);
  } else if (change) {
    self._enableChange(); 
  } else {
    self._get();
  }
};

Sensor.prototype.stopListening = function () {
  if (this.timer) {
    clearInterval(this.timer);
    this.timer = null;
  }
};

Sensor.prototype.get = function () {
  this.emit('data', {stauts: 'ok', sensor: ''});
};

Sensor.getLogger = function () {
  return logger;
};

Sensor.prototype.close = function () {};

/*
 * Actuator
 */
function Actuator(id, options) {
  this.id = id;
  this.options = options;
  EventEmitter.call(this);
}
util.inherits(Actuator, EventEmitter);

Actuator.properties = {};

Actuator.set = function (cmd, options, cb) {
  if (_.contains(this.properties.commands, cmd)) {
    return this[cmd](options, cb);
  } else {
    return cb && cb(new Error('unknown command'));
  }
};

Actuator.getStatus = function () {
  return undefined;
};

exports.Sensor = Sensor;
exports.Actuator = Actuator;
