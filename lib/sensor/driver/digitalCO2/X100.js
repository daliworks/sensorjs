"use strict";

var util = require('util');
var Wire = require('i2c');
var events = require('events');
var _ = require('lodash');
var async = require('async');
var debug;
var defaultOptions = {
  'debug': false,
  'address': 0x23,
  'device': '/dev/i2c-1',
  'powerMode': 'powerOn'
};

var X100 = function(opts) {
  var self = this;

  events.EventEmitter.call(this);
  self.options = _.extend({}, defaultOptions, opts);
  self.wire = new Wire(this.options.address, {
    device: this.options.device,
    debug: this.options.debug
  });

};

util.inherits(X100, events.EventEmitter);

X100.powerModes = {
  'powerDown': 0x00,
  'powerOn': 0x01
};

X100.commands = {
  'CO2': 0xA2,
  'StatusError': 0xA5,
  'All': 0xA1
};

X100.prototype.init = function(callback) {
  var self = this;

  async.series([
    function(cB) {
      self.setPowerMode(self.options.powerMode, cB);
    }
  ], function(err, res) {
    var ts = Math.round(+new Date() / 1000);
    var evData = {
      'addr': self.options.address,
      'type': 'X100',
      'ts': ts,
      'error': err
    };
    if (err) {
      self.emit('sensorInitFailed', evData);
      if (callback) callback(err, null);
    } else {
      self.emit('sensorInitCompleted', evData);
      if (callback) callback(null, true);
    }
  });
};

X100.prototype.setPowerMode = function(newMode, callback) {
  var self = this;

  if (_.has(X100.powerModes, newMode) === false) {
    var err = new Error('wrong powermode value in set powermode command');
    var ts = Math.round(+new Date() / 1000);
    var evData = {
      'addr': self.options.address,
      'type': 'X100',
      'setting': 'powerMode',
      'newValue': newMode,
      'ts': ts,
      'error': err
    };
    self.emit('sensorSettingFailed', evData);
    if (callback) callback(err, null);
    return;
  }

  async.waterfall([
    function(cB) {
      var writeVal;

      writeVal = X100.powerModes[newMode];

      self.wire.writeByte(writeVal, function(err) {
        if (err) {
          cB(new Error('powermode not set on write'), 'write');
        } else {
          cB(null, 'write');
        }
      });
    }
    ],
    function(err, results) {
      var ts = Math.round(+new Date() / 1000);
      var evData = {
        'addr': self.options.address,
        'type': 'X100',
        'setting': 'powerMode',
        'newValue': newMode,
        'ts': ts,
        'error': err
      };
      if (err) {
        self.emit('sensorSettingFailed', evData);
        if (callback) callback(err, null);
      } else {
        self.options.powerMode = newMode;
        self.emit('sensorSettingChanged', evData);
        if (callback) callback(null, newMode);
      }
    });
};

X100.prototype.getCO2 = function(command, callback) {
  var self = this;

  var commandCode =  X100.commands.command;

  var hi = 0, lo = 0, li = 0,
      status = 0, error = 0,
      rtn = {};

  switch (command.toLowerCase()) {
    case 'co2':
      self.wire.readBytes(commandCode, 2, function(err, bytes) {
        if (err) {
          callback(err);
        } else {
          hi = bytes.readUInt8(0);
          lo = bytes.readUInt8(1);
          li = (hi << 8) + lo;

          console.log('getCO2 - hi, lo, li', hi, lo, li);

          rtn.co2 = li;

          callback(null, rtn);
        }
      });

      break;
    case 'statuserror':
      self.wire.readBytes(commandCode, 2, function(err, bytes) {
        if (err) {
          callback(err);
        } else {
          status = bytes.readUInt8(0);
          error = bytes.readUInt8(1);

          console.log('getStatusError - status, error', status, error);

          rtn.status = status;
          rtn.error = error;

          callback(null, rtn);
        }
      });

      break;
    case 'all':
      self.wire.readBytes(commandCode, 4, function(err, bytes) {
        if (err) {
          callback(err);
        } else {
          hi = bytes.readUInt8(1);
          lo = bytes.readUInt8(0);
          li = (hi << 8) + lo;

          status = bytes.readUInt8(2);
          error = bytes.readUInt8(3);

          console.log('getAll - hi, lo, li, status, error', hi, lo, li, status, error);

          rtn.co2 = li;
          rtn.status = status;
          rtn.error = error;

          callback(null, rtn);
        }
      });

      break;       
    default:
      console.log('command is not found');
      callback(null, rtn);
  }


};

X100.prototype.getDensity = function(callback) {
  var self = this,
      command;

  command = self.options.command || 'All';

  async.series([
    function(cB) {
      self.getCO2(command, cB);
    }
  ], function(err, results) {
    //console.log(results)
    var ts = Math.round(+new Date() / 1000);
    var evData = {
      'addr': self.options.address,
      'type': 'X100',
      'valType': 'co2',
      'ts': ts,
      'error': err
    };

    if (err) {
      self.emit('sensorValueError', evData);
      if (callback) callback(err, null);
    } else if (results[0].co2 === 0) {
      var e = new Error('invalid value(s) from sensor');
      evData.error = e;
      self.emit('sensorValueError', evData);
      if (callback) callback(e, null);
    } else {
      evData.sensVal = results[0].co2;
      self.emit('newSensorValue', evData);
      if (callback) callback(null, results[0].co2);
    }
  });
};

module.exports = X100;
