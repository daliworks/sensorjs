'use strict';

var Sensor = require('../').Sensor,
    logger = Sensor.getLogger(),
    util = require('util'),
    I2c = require('i2c'),
    serialport = require('serialport'),
    events = require('events'),
    _ = require('lodash'),
    async = require('async');

var defaultOptions = {
  i2c: {
    'debug': false,
    'address': 0x23,
    'device': '/dev/i2c-1',
    'powerMode': 'powerOn'
  },
  uart: {
    'address': 4,
    'device': '/dev/ttyO4'
  }
};

var X100 = function(opts) {
  events.EventEmitter.call(this);

  this.options = _.extend({}, defaultOptions[opts.sensorNetwork], opts);

  switch (this.options.sensorNetwork) {
    case 'i2c':
      this.i2c = new I2c(this.options.address, {
        device: this.options.device,
        debug: this.options.debug
      });

      break;
    case 'uart':
      this.i2c = new serialport.SerialPort('/dev/ttyO' + this.options.address, {
        baudrate: this.options.baudrate || 9600,
        parser: serialport.parsers.readline('\n\r')
      });

      break;
    default:
      logger.warn('[DigitalCO2/Driver] ' + this.options.sensorNetwork + ' sensor network is not supported');
  }    
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

  switch (this.options.sensorNetwork) {
    case 'i2c':
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
          if (callback) { callback(err, null); }
        } else {
          self.emit('sensorInitCompleted', evData);
          if (callback) { callback(null, true); }
        }
      });

      break;
    case 'uart':
      logger.info('[DigitalCO2/Driver/X100] init with uart', this.options);

      this.i2c.on('open', function () {
        self.i2c.on('data', function(data) {
          var rtn, result;

          // # 0471 XXX.X XX Nr Nr
          result = data.toString().split(' ');

          if (result.length >= 6) {
            if (result[4] === 'Nr' && result[5] === 'Nr') {
              rtn = {
                status: 'ok',
                result: {
                  'co2': Number(result[1], 10)
                }
              };
            } else if (result[4] === 'WU') {
              rtn = {
                status: 'error',
                message: 'Sensor is warming up.'
              };
            } else if (result[5] === 'Er') {
              rtn = {
                status: 'error',
                message: 'Sensor is Error. Replace the CO2 Sensor.'
              };
            } else {
              rtn = {
                status: 'error',
                message: 'Data from the sensor is not valid values'
              };
            }
          } else {
            rtn = {
              status: 'error',
              message: 'Data from the sensor is not valid format'
            }; 
          }

          //logger.debug('[DigitalCO2/Driver] on data', data, rtn);
          self.emit('data', rtn);
        });
      });

      break;
    default:
      logger.warn('[DigitalCO2/Driver] ' + this.options.sensorNetwork + ' sensor network is not supported');
  }
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
    if (callback) { callback(err, null); }
    return;
  }

  async.waterfall([
    function(cB) {
      var writeVal;

      writeVal = X100.powerModes[newMode];

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
        'type': 'X100',
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

X100.prototype.getCO2 = function(command, callback) {
  var self = this;

  var commandCode =  X100.commands.command;

  var hi = 0, lo = 0, li = 0,
      status = 0, error = 0,
      rtn = {};

  switch (command.toLowerCase()) {
    case 'co2':
      self.i2c.readBytes(commandCode, 2, function(err, bytes) {
        if (err) {
          callback(err);
        } else {
          hi = bytes.readUInt8(0);
          lo = bytes.readUInt8(1);
          li = (hi << 8) + lo;

          logger.debug('getCO2 - hi, lo, li', hi, lo, li);

          rtn.co2 = li;

          callback(null, rtn);
        }
      });

      break;
    case 'statuserror':
      self.i2c.readBytes(commandCode, 2, function(err, bytes) {
        if (err) {
          callback(err);
        } else {
          status = bytes.readUInt8(0);
          error = bytes.readUInt8(1);

          logger.debug('getStatusError - status, error', status, error);

          rtn.status = status;
          rtn.error = error;

          callback(null, rtn);
        }
      });

      break;
    case 'all':
      self.i2c.readBytes(commandCode, 4, function(err, bytes) {
        if (err) {
          callback(err);
        } else {
          hi = bytes.readUInt8(1);
          lo = bytes.readUInt8(0);
          li = (hi << 8) + lo;

          status = bytes.readUInt8(2);
          error = bytes.readUInt8(3);

          logger.debug('getAll - hi, lo, li, status, error', hi, lo, li, status, error);

          rtn.co2 = li;
          rtn.status = status;
          rtn.error = error;

          callback(null, rtn);
        }
      });

      break;       
    default:
      logger.info('command is not found');
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
    //logger.info(results)
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
      if (callback) { callback(err, null); }
    } else if (results[0].co2 === 0) {
      var e = new Error('invalid value(s) from sensor');
      evData.error = e;
      self.emit('sensorValueError', evData);
      if (callback) { callback(e, null); }
    } else {
      evData.sensVal = results[0].co2;
      self.emit('newSensorValue', evData);
      if (callback) { callback(null, results[0].co2); }
    }
  });
};

module.exports = X100;
