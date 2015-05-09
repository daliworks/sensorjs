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
  'address': 0x40,
  'device': '/dev/i2c-1',
  'powerMode': 'powerOn',
  'command': 'Trigger_Humidity_Hold_Master'
};

var HTU21D = function(opts) {
  events.EventEmitter.call(this);

  this.options = _.extend({}, defaultOptions, opts);

  this.i2c = new I2c(this.options.address, {
    device: this.options.device,
    debug: this.options.debug
  });
};

util.inherits(HTU21D, events.EventEmitter);

HTU21D.commands = {
  'Trigger_Temperature_Hold_Master': 0xE3,
  'Trigger_Humidity_Hold_Master': 0xE5,
  'Trigger_Temperature_No_Hold_Master': 0xF3,
  'Trigger_Humidity_No_Hold_Master': 0xF5,
  'Write_User_Register': 0xE6,
  'Read_User_Register': 0xE7,
  'Soft_Reset': 0xFE
};

HTU21D.prototype.init = function(callback) {
  var self = this;

  async.series([
    function(done) {
      self.reset('Soft_Reset', done);
    },
    function(done) {
      self.begin('Read_User_Register', done);
    }
  ], function(err, result) {
    var ts = Math.round(+new Date() / 1000);
    var evData = {
      'addr': self.options.address,
      'type': 'HTU21D',
      'ts': ts,
      'result': result,
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

HTU21D.prototype.reset = function(command, callback) {
  var self = this;

  async.series([
    function(done) {
      var writeVal;

      writeVal = HTU21D.commands[command];

      self.i2c.writeByte(writeVal, function(err) {
        if (err) {
          done(new Error('reset error'));
        } else {
          done(null);
        }
      });
    },
    function(done) {
      setTimeout(function () {
        done(null);
      }, 15);
    }
  ], function(err) {
    var ts = Math.round(+new Date() / 1000);
    var evData = {
      'addr': self.options.address,
      'type': 'HTU21D',
      'setting': 'reset',
      'newValue': command,
      'ts': ts,
      'error': err
    };
    if (err) {
      self.emit('sensorSettingFailed', evData);
      if (callback) { callback(err); }
    } else {
      self.emit('sensorSettingChanged', evData);
      if (callback) { callback(null, command); }
    }
  });
};

HTU21D.prototype.begin = function(command, callback) {
  var self = this;

  async.series([
    function(done) {
      var writeVal;

      writeVal = HTU21D.commands[command];

      self.i2c.writeByte(writeVal, function(err) {
        if (err) {
          done(new Error('begin error'));
        } else {
          done(null);
        }
      });
    },
    function(done) {
      self.i2c.readByte(function(err, res) {
        if (err) {
          done(new Error('begin error'));
        } else {
          // after reset should be 0x2
          logger.info('[DigitalHumidity/driver/HTU21D] begin success', res);

          // TODO: check res in the init process and reset again if the res is not 0x2

          done(null, res);
        }
      });
    }
  ], function(err, result) {
    var ts = Math.round(+new Date() / 1000);
    var evData = {
      'addr': self.options.address,
      'type': 'HTU21D',
      'setting': 'begin',
      'newValue': command,
      'ts': ts,
      'error': err
    };
    if (err) {
      self.emit('sensorSettingFailed', evData);
      if (callback) { callback(err); }
    } else {
      self.emit('sensorSettingChanged', evData);
      if (callback) { callback(null, result); }
    }
  });
};

HTU21D.prototype.getHumidity = function(callback) {
  var self = this,
      command;

  command = HTU21D.commands[self.options.command] || HTU21D.command.Trigger_Humidity_Hold_Master;

  var hi = 0, lo = 0, li, crc;

  self.i2c.readBytes(command, 3, function(err, bytes) {
    if (err) {
      callback(err);
    } else {
      hi = bytes.readUInt8(0);
      lo = bytes.readUInt8(1);
      li = (hi << 8) + lo;

      li *= 125;
      li /= 65536;
      li -= 6;

      // TODO: check crc and retry for the DigitalHumidity.properties.maxRetries
      crc = bytes.readUInt8(2);

      logger.info('[DigitalHumidity/driver/HTU21D] getHumidity - hi, lo, li, crc', hi, lo, li, crc);

      callback(null, li);
    }
  });
};

HTU21D.prototype.getPercent = function(callback) {
  var self = this;

  async.series([
    function(done) {
      self.getHumidity(done);
    }
  ], function(err, results) {
    //logger.info(results)
    var ts = Math.round(+new Date() / 1000);
    var evData = {
      'addr': self.options.address,
      'type': 'HTU21D',
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

module.exports = HTU21D;
