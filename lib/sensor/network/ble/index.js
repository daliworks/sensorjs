'use strict';

var fs = require('fs'),
  util = require('util'),
  Network = require('./index');

function Ble(id, options) {
  Network.call(this, id, options);
}

util.inherits(Ble, Network);

Ble.prototype.pair = function (addr, cb) {
  return cb && cb();
};

Ble.prototype.scan = function (options, cb) {
};

Ble.prototype.discover = function (options, cb) {
  var self = this;
  if (typeof options === 'function') {
    cb = options;
    options = undefined;
  }
};

module.exports = Ble;
