'use strict';

var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    _ = require('lodash'),
    logger = require('log4js').getLogger('Network');

/*
 * Network
 */
function Network(networkName, options) {
  var props = this.properties = this.constructor.properties;

  if (networkName) {
    this.sensorNetwork = networkName;
  } else {
    if (props && props.sensorNetwork) {
      this.sensorNetwork = props.sensorNetwork;
    }
  }
  this.options = options;

  EventEmitter.call(this);
}

util.inherits(Network, EventEmitter);

Network.properties = {sensorNetwork: 'none'};

Network.prototype.discover = function (options, cb) {
  if (typeof options === 'function') {
    cb = options;
  }
  return cb && cb(new Error('NOT IMPLEMENTED'));
};

Network.prototype.getDevice = function (addr, options, cb) {
  if (typeof options === 'function') {
    cb = options;
  }
  return cb && cb(new Error('NOT IMPLEMENTED'));
};

Network.getLogger = function () {
  return logger;
};

Network.prototype.close = function () {};

Network.getStatus = function () {
  return undefined;
};

module.exports = Network;
