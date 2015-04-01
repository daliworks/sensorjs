'use strict';

var EventEmitter = require('events').EventEmitter,
  util = require('util'),
  _ = require('lodash'),
  querystring = require('querystring'),
  sensorLib = require('../'),
  logger = require('log4js').getLogger('Sensor');

function template(str, tokens) {
  return str.replace(/\{(\w+)\}/g, function (x, key) {
    return tokens[key];
  });
}

/*
 * Sensor
 * param options {Object} 
 *    getTimeout: timeout in ms, default recommendedInterval*2
 *    connTimeout: timeout in ms, driver specific default
 */
function Sensor(sensorInfo, options) {
  var props = this.properties = this.constructor.properties;
  var id = sensorInfo.id;

  if (id) {
    this.id = id;
  } else {
    if (props && props.id) {
      this.id = template(props.id, options);
    }
  }
  this.info = sensorInfo;
  this.options =  _.defaults(options || {}, sensorInfo.options);
  this.model = sensorInfo.model;
  this.device = sensorInfo.device;

  EventEmitter.call(this);
}

util.inherits(Sensor, EventEmitter);

Sensor.properties = {};
Sensor.prototype.getProperties = function () {
  return sensorLib.getSensorProperties(this.model);
};

// listen 'data' event once unless interval is provided and not zero.
// listen 'change' event if 'change' is provided
// previous listener stops before enabling new one.
Sensor.prototype.listen = function (intervalOrEvent) {
  var self = this,
    props = this.getProperties(),
    interval, change;

  if (intervalOrEvent !== null && intervalOrEvent !== undefined) {
    if (typeof intervalOrEvent === 'number') {
      interval = intervalOrEvent;
    } else if (intervalOrEvent === 'change') {
      change = true;
    }
  } else {
    interval = props.recommendedInterval;
  }

  if (interval > 0) {
    if (this.listenTimer) {
      clearInterval(this.listenTimer);
      this.listenTimer = null;
    }
    this.listenTimer = setInterval(function () {
      self._get();
    }, interval);
    self._get(); // get as soon as possible
  } else if (change) {
    self._enableChange(); 
  } else {
    self._get();
  }
};

Sensor.prototype.stopListening = function () {
  if (this.listenTimer) {
    clearInterval(this.listenTimer);
    this.listenTimer = null;
  }
};

Sensor.prototype.get = function (cb) {
  if (cb) {
    this.once('data', function (data) {
      return cb(null, data); 
    });
  }
  this._get();
};

Sensor.prototype.clear = function () {
  this.stopListening();
  this.removeAllListeners();
  return this._clear && this._clear();
};

Sensor.prototype.getStatus = function () {
  // FIXME: alternatively use event emittor
  throw new Error('NOT IMPLEMENTED');
};

Sensor.getLogger = function () {
  return logger;
};

Sensor.prototype.close = function () {};

/*
 * Actuator
 */
function Actuator(sensorInfo, options) {
  var props = this.properties = this.constructor.properties;
  var id = sensorInfo.id;
    
  if (id) {
    this.id = id;
  } else {
    if (props && props.id) {
      this.id = template(props.id, options);
    }
  }
  this.info = sensorInfo;
  this.options = options;
  this.model = sensorInfo.model;

  EventEmitter.call(this);
}
util.inherits(Actuator, EventEmitter);

Actuator.properties = {};
Actuator.prototype.getProperties = function () {
  return sensorLib.getSenosrProperties(this.model);
};

Actuator.prototype.set = function (cmd, options, cb) {
  var commands = _.isArray(this.properties.commands) ? 
     this.properties.commands : (this.properties.commands && this.properties.commands[this.model]);
  if (!_.contains(commands, cmd)) {
    return cb && cb(new Error('unknown command'));
  }
  if (_.isFunction(this._set)) {
    this._set(cmd, options, cb); 
  } else {
    return this[cmd](options, cb);
  }
};

Actuator.prototype.clear = function (/*cmd, options, cb*/) {
  return this._clear && this._clear();
};

Actuator.prototype.getStatus = function () {
  return 'on';
};

Actuator.getLogger = function () {
  return logger;
};

/*
 * Device
 */
function Device(network, addr, sensorInfos) {
  var self = this; 
  this.network = network;
  this.address = addr;
  this.deviceHandle = {};
  this.url = ['sensorjs://', network.sensorNetwork, addr].join('/');
  this.sensorUrls = [];
  _.each(sensorInfos, function(sensorInfo) {
    var url = [self.url, sensorInfo.model, sensorInfo.id].join('/');
    if (sensorInfo.options) {
      url += '?' + querystring.stringify(sensorInfo.options);
    }
    self.sensorUrls.push(url);
    if (sensorInfo.deviceHandle) { // FIXME: not to manage sensor connection 
                                   //ex. futuretek snmp device connection
      self.deviceHandle[sensorInfo.id] = sensorInfo.deviceHandle;
    }
  });
  EventEmitter.call(this);
}
util.inherits(Device, EventEmitter);
Device.properties = {};
Device.prototype.getStatus = function () {
  // FIXME: alternatively use event emittor
  throw new Error('NOT IMPLEMENTED');
};
exports.Sensor = Sensor;
exports.Actuator = Actuator;
exports.Device = Device;
