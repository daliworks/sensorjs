'use strict';

var Sensor = require('../').Sensor,
    util = require('util'),
    fs = require('fs'),
    _cached = {retries: 0},
    logger = Sensor.getLogger(),
    I2c = require('i2c'),
    TSL2561 = require('sensor_tsl2561'),
    BH1750 = require('./BH1750');

var I2C_BUS = '/dev/i2c-', // ic2 bus
    I2C_BUS_ID = 1,
    I2C_ADDRESS_ID = 0x48; // i2c address id

function DigitalLight(sensorInfo, options) {
  var bus, sensOptions;

  Sensor.call(this, sensorInfo, options);

  if (sensorInfo.model) {
    this.model = sensorInfo.model;
  } else {
    this.model = (options && options.model === 'TSL2561') ? 'TSL2561' : 'BH1750';
  }

  bus = I2C_BUS + (sensorInfo.device.bus || I2C_BUS_ID);

  if (sensorInfo.device.address) {
    switch (this.model) {
      case 'TSL2561':
        sensOptions = {
          address: sensorInfo.device.address,
          device: bus
        };

        this.wire = new TSL2561(sensOptions);

        this.wire.init(function (err, val) {
          if (err) {
            logger.error('[DigitalLight] TSL2561 - error on sensor init: ', err);
          } else {
            logger.debug('[DigitalLight] TSL2561 - sensor init completed: ', val);
          }
        });

        break;
      case 'BH1750':
        sensOptions = {
          address: sensorInfo.device.address,
          device: bus
        };

        this.wire = new BH1750(sensOptions);

        this.wire.init(function (err, val) {
          if (err) {
              logger.error('[DigitalLight] BH1750 - error with power on', new Error('powermode not set on write'));
          } else {
              logger.debug('[DigitalLight] BH1750 - power on');
          }
        });

        break;
      default:
        this.wire = new I2c(sensorInfo.device.address, {device: bus});
    }
    
    logger.debug('DigitalLight sensor is created at driver', sensorInfo);
  } else {
    logger.warn('DigitalLight sensor address is not provided');
  }
}

DigitalLight.properties = {
  supportedNetworks: ['i2c'],
  dataTypes: ['light'],
  onChange: false,
  discoverable: false,
  addressable: true,
  recommendedInterval: 30000,
  maxInstances: 10,
  models: ['TSL2561', 'BH1750'],
  id: '{model}-{macAddress}-{address}',
  maxRetries: 8,
  bus: I2C_BUS_ID,
  address: I2C_ADDRESS_ID
};

util.inherits(DigitalLight, Sensor);

/*
 * Get the light of a given sensor
 * @param sensor : The sensor ID
 * @param callback : callback (err, {id, value})
*/
DigitalLight.prototype._get = function () {
  var self = this, rtn,
      readLightCmd = 0x80;

  try {
    switch (this.model) {
      case 'TSL2561':
        this.wire.getLux(function (err, data) {
          if (err) {
            rtn = {status: 'off', id : self.id, message: err.toString()};
          } else {
            rtn = {status: 'ok', id : self.id, result: {'light': data}};
          }

          logger.debug('[DigitalLight] TSL2561 - data, rtn, info, properties.address - ',
              data, rtn, self.info, DigitalLight.properties.address);

          self.emit('data', rtn);
        });

        break;
      case 'BH1750':
        this.wire.getLux(function (err, data) {
          if (err) {
            rtn = {status: 'off', id : self.id, message: err.toString()};
          } else {
            rtn = {status: 'ok', id : self.id, result: {'light': data}};
          }

          logger.debug('[DigitalLight] BH1750 - data, rtn, info, properties.address - ',
              data, rtn, self.info, DigitalLight.properties.address);

          self.emit('data', rtn);
        });

        break;
      default:
        this.wire.readBytes(readLightCmd, 2, function (err, data) {
          if (err) {
            rtn = {status: 'off', id : self.id, message: err.toString()};
          } else {
            rtn = {status: 'ok', id : self.id, result: {'light': data}};
          }

          logger.debug('[DigitalLight] data, rtn, info, properties.address - ',
              data, rtn, self.info, DigitalLight.properties.address);

          self.emit('data', rtn);
        });
    }
  } catch (e) {
    logger.error('[DigitalLight] error', e);
  }
};

module.exports = DigitalLight;
