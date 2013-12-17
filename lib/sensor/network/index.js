'use strict';

var EventEmitter = require('events').EventEmitter,
  util = require('util'),
  _ = require('lodash'),
  logger = require('log4js').getLogger('Sensor');

function template(str, tokens) {
  return str.replace(/\{(\w+)\}/g, function (x, key) {
    return tokens[key];
  });
}


/*
 * Network
 */
function Network(protocol, options) {
  var props = this.properties = this.constructor.properties;

  if (protocol) {
    this.protocol = protocol;
  } else {
    if (props && props.protocol) {
      this.protocol = props.protocol;
    }
  }
  this.options = options;

  EventEmitter.call(this);
}

util.inherits(Network, EventEmitter);

Network.properties = {protocol: 'none'};

Network.prototype.discover = function (options, cb) {
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
