'use strict';

var Sensor = require('../').Sensor,
    util = require('util'),
    fs = require('fs'),
    _cached = {retries: 0},
    logger = Sensor.getLogger(),
    I2c = require('i2c'),
    X100 = require('./X100');

var I2C_BUS = '/dev/i2c-', // ic2 bus
    I2C_BUS_ID = 1,
    I2C_ADDRESS_ID = 0x23; // i2c address id

function DigitalCO2(sensorInfo, options) {
  var bus, sensOptions;

  Sensor.call(this, sensorInfo, options);

  if (sensorInfo.model) {
    this.model = sensorInfo.model;
  } else if (options && options.model) {
    this.model = options.model;
  }

  bus = I2C_BUS + (sensorInfo.device.bus || I2C_BUS_ID);

  if (sensorInfo.device.address) {
    switch (this.model) {
      case 'X100':
        sensOptions = {
          address: sensorInfo.device.address,
          device: bus
        };

        this.wire = new X100(sensOptions);

        this.wire.on('sensorSettingChanged', function (e) {
          logger.debug('[DigitalCO2] sensorSettingChanged', e);
        });
        this.wire.on('sensorSettingFailed', function (e) {
          logger.debug('[DigitalCO2] sensorSettingFailed', e);
        });
        this.wire.on('newSensorValue', function (e) {
          logger.debug('[DigitalCO2] newSensorValue', e);
        });
        this.wire.on('sensorValueError', function (e) {
          logger.debug('[DigitalCO2] sensorValueError', e);
        });

        this.wire.init(function (err, val) {
          if (err) {
              logger.error('[DigitalCO2] X100 - error with power on', new Error('powermode not set on write'));
          } else {
              logger.debug('[DigitalCO2] X100 - power on');
          }
        });

        break;
      default:
        this.wire = new I2c(sensorInfo.device.address, {device: bus});
    }
    
    logger.debug('DigitalCO2 sensor is created at driver', sensorInfo);
  } else {
    logger.warn('DigitalCO2 sensor address is not provided');
  }
}

DigitalCO2.properties = {
  supportedNetworks: ['i2c'],
  dataTypes: ['co2'],
  onChange: false,
  discoverable: false,
  addressable: true,
  recommendedInterval: 30000,
  maxInstances: 10,
  models: ['X100'],
  id: '{model}-{macAddress}-{address}',
  maxRetries: 8,
  bus: I2C_BUS_ID,
  address: I2C_ADDRESS_ID
};

util.inherits(DigitalCO2, Sensor);

/*
 * Get the co2 of a given sensor
 * @param sensor : The sensor ID
 * @param callback : callback (err, {id, value})
*/
DigitalCO2.prototype._get = function () {
  var self = this, rtn,
      readLightCmd = 0x80;

  try {
    switch (this.model) {
      case 'X100':
        this.wire.getDensity(function (err, data) {
          if (err) {
            rtn = {status: 'off', id : self.id, message: err.toString()};
          } else {
            rtn = {status: 'ok', id : self.id, result: {'co2': data}};
          }

          logger.debug('[DigitalCO2] X100 - data, rtn, info, properties.address - ',
              data, rtn, self.info, DigitalCO2.properties.address);

          self.emit('data', rtn);
        });

        break;
      default:
        this.wire.readBytes(readLightCmd, 2, function (err, data) {
          if (err) {
            rtn = {status: 'off', id : self.id, message: err.toString()};
          } else {
            rtn = {status: 'ok', id : self.id, result: {'co2': data}};
          }

          logger.debug('[DigitalCO2] data, rtn, info, properties.address - ',
              data, rtn, self.info, DigitalCO2.properties.address);

          self.emit('data', rtn);
        });
    }
  } catch (e) {
    logger.error('[DigitalCO2] error', e);
  }
};

module.exports = DigitalCO2;
