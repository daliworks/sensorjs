'use strict';

var fs = require('fs'),
  util = require('util'),
  Network = require('../index'),
  Device = require('../../index').Device;

function OneWire(options) {
  Network.call(this, 'w1', options);
}

util.inherits(OneWire, Network);

OneWire.prototype.discover = function (options, cb) {
  var self = this;
  if (typeof options === 'function') {
    cb = options;
    options = undefined;
  }
  fs.readFile('/sys/bus/w1/devices/w1_bus_master1/w1_master_slaves', 'utf8', 
  function (err, data) {
    if (err) {
      if (cb) {
        return cb(new Error('network failure'));
      } else {
        return self.emit('error', err);
      }
    } else {
      var parts = data.split('\n'),
        devices = [];

      parts.pop();
      if (parts.toString() === 'not found.') {
        if (cb) {
          return cb(new Error('There is no sensors'));
        } else {
          return self.emit('error', new Error('No sensor')); 
        }
      } else {
        parts.forEach(function (addr) {
          var device = new Device(self, addr, [addr]); // sensorId is same as address
          devices.push(device);
        });
        if (cb) {
          return cb(null, devices);
        } else {
          self.emit('discovered', devices); 
          self.emit('done'); 
        }
      }
    }
  });
};

module.exports = new OneWire();
