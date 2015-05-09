"use strict";

var Sensor = require('../index').Sensor,
    logger = Sensor.getLogger(),
    util = require('util'),
    I2c = require('i2c'),
    events = require('events'),
    _ = require('lodash'),
    async = require('async');

var defaultOptions = {
  'debug': false,
  'address': 0x23,
  'device': '/dev/i2c-1',
  'powerMode': 'powerOn',
  'measurementMode': 'Continuous_H_Resolution_Mode'
};

var BH1750 = function(opts) {
  events.EventEmitter.call(this);

  this.options = _.extend({}, defaultOptions, opts);

  this.i2c = new I2c(this.options.address, {
    device: this.options.device,
    debug: this.options.debug
  });
};

util.inherits(BH1750, events.EventEmitter);

BH1750.powerModes = {
  'powerDown': 0x00,
  'powerOn': 0x01
};

BH1750.measurementModes = {
  'Continuous_H_Resolution_Mode': 0x10,
  'Continuous_H_Resolution_Mode2': 0x11,
  'Continuous_L_Resolution_Mode': 0x13,
  'OneTime_H_Resolution_Mode': 0x20,
  'OneTime_H_Resolution_Mode2': 0x21,
  'OneTime_L_Resolution_Mode': 0x23
};

BH1750.prototype.init = function(callback) {
  var self = this;

  async.series([
    function(cB) {
      self.setPowerMode(self.options.powerMode, cB);
    }
  ], function(err, res) {
    var ts = Math.round(+new Date() / 1000);
    var evData = {
      'addr': self.options.address,
      'type': 'BH1750',
      'ts': ts,
      'error': err
    };
    if (err) {
      self.emit('sensorInitFailed', evData);
      if (callback) { callback(err, null); }
    } else {
      self.emit('sensorInitCompleted', evData);
      if (callback) { callback(null, true); }
    }
  });
};

BH1750.prototype.setPowerMode = function(newMode, callback) {
  var self = this;

  if (_.has(BH1750.powerModes, newMode) === false) {
    var err = new Error('wrong powermode value in set powermode command');
    var ts = Math.round(+new Date() / 1000);
    var evData = {
      'addr': self.options.address,
      'type': 'BH1750',
      'setting': 'powerMode',
      'newValue': newMode,
      'ts': ts,
      'error': err
    };
    self.emit('sensorSettingFailed', evData);
    if (callback) { callback(err, null); }
    return;
  }

  async.waterfall([
    function(cB) {
      var writeVal;

      writeVal = BH1750.powerModes[newMode];

      self.i2c.writeByte(writeVal, function(err) {
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
        'type': 'BH1750',
        'setting': 'powerMode',
        'newValue': newMode,
        'ts': ts,
        'error': err
      };
      if (err) {
        self.emit('sensorSettingFailed', evData);
        if (callback) { callback(err, null); }
      } else {
        self.options.powerMode = newMode;
        self.emit('sensorSettingChanged', evData);
        if (callback) { callback(null, newMode); }
      }
    });
};

BH1750.prototype.getLight = function(callback) {
  var self = this;

  var measurementMode =  BH1750.measurementModes[self.options.measurementMode] ||
  BH1750.measurementModes.Continuous_H_Resolution_Mode;

  var hi = 0, lo = 0, li;

  self.i2c.readBytes(measurementMode, 2, function(err, bytes) {
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

BH1750.prototype.getLux = function(callback) {
  var self = this;

  async.series([
    function(cB) {
      self.getLight(cB);
    }
  ], function(err, results) {
    //logger.info(results)
    var ts = Math.round(+new Date() / 1000);
    var evData = {
      'addr': self.options.address,
      'type': 'BH1750',
      'valType': 'light',
      'ts': ts,
      'error': err
    };

    if (err) {
      self.emit('sensorValueError', evData);
      if (callback) { callback(err, null); }
    } else if (_.isUndefined(results[0]) || _.isNull(results[0]) || results[0] < 0) {
      var e = new Error('invalid value(s) from sensor');
      evData.error = e;
      self.emit('sensorValueError', evData);
      if (callback) { callback(e, null); }
    } else {
      evData.sensVal = results[0];
      self.emit('newSensorValue', evData);
      if (callback) { callback(null, results[0]); }
    }
  });
};

module.exports = BH1750;
