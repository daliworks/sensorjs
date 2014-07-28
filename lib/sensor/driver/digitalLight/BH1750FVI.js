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
  'powerMode': 'powerOn',
  'measurementMode': 'Continuous_H_Resolution_Mode'
};

var BH1750FVI = function(opts) {
  var self = this;

  events.EventEmitter.call(this);
  self.options = _.extend({}, defaultOptions, opts);
  self.wire = new Wire(this.options.address, {
    device: this.options.device,
    debug: this.options.debug
  });

};

util.inherits(BH1750FVI, events.EventEmitter);

BH1750FVI.powerModes = {
  'powerDown': 0x00,
  'powerOn': 0x01
};

BH1750FVI.measurementModes = {
  'Continuous_H_Resolution_Mode': 0x10,
  'Continuous_H_Resolution_Mode2': 0x11,
  'Continuous_L_Resolution_Mode': 0x13,
  'OneTime_H_Resolution_Mode': 0x20,
  'OneTime_H_Resolution_Mode2': 0x21,
  'OneTime_L_Resolution_Mode': 0x23
};

BH1750FVI.prototype.init = function(callback) {
  var self = this;

  async.series([
    function(cB) {
      self.getSensorId(cB);
    },
    function(cB) {
      self.setPowerMode(self.options.powerMode, cB);
    }
  ], function(err, res) {
    var ts = Math.round(+new Date() / 1000);
    var evData = {
      'addr': self.options.address,
      'type': 'BH1750FVI',
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

BH1750FVI.prototype.setPowerMode = function(newMode, callback) {
  var self = this;

  if (_.has(self.powerModes, newMode) === false) {
    var err = new Error('wrong powermode value in set powermode command');
    var ts = Math.round(+new Date() / 1000);
    var evData = {
      'addr': self.options.address,
      'type': 'BH1750FVI',
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

      writeVal = self.powerModes[newMode];

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
        'type': 'BH1750FVI',
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

BH1750FVI.prototype.getLight = function(callback) {
  var self = this;

  var measurementMode =  BH1750FVI.measurementModes[self.options.measurementMode] ||
  BH1750FVI.measurementModes.Continuous_H_Resolution_Mode;

  var hi = 0, lo = 0, li = 0;

  self.wire.readBytes(measurementMode, 2, function(err, bytes) {
    if (err) {
      callback(err);
    } else {
      hi = bytes.readUInt8(0);
      lo = bytes.readUInt8(1);
      li = (hi << 8) + lo;
      li /= 1.2;

      callback(null, li);
    }
  });
};

BH1750FVI.prototype.getLux = function(callback) {
  var self = this;

  async.series([
    function(cB) {
      self.getLight(cB);
    }
  ], function(err, results) {
    //console.log(results)
    var ts = Math.round(+new Date() / 1000);
    var evData = {
      'addr': self.options.address,
      'type': 'BH1750FVI',
      'valType': 'light',
      'ts': ts,
      'error': err
    };

    if (err) {
      self.emit('sensorValueError', evData);
      if (callback) callback(err, null);
    } else if (results[0] === 0) {
      var e = new Error('invalid value(s) from sensor');
      evData.error = e;
      self.emit('sensorValueError', evData);
      if (callback) callback(e, null);
    } else {
      evData.sensVal = results[0];
      self.emit('newSensorValue', evData);
      if (callback) callback(null, results[0]);
    }
  });
};

module.exports = BH1750FVI;