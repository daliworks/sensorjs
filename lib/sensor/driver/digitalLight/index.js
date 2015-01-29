'use strict';

var Sensor = require('../').Sensor,
    util = require('util'),
    _cached = {retries: 0},
    logger = Sensor.getLogger(),
    TSL2561 = require('sensor_tsl2561'),
    BH1750 = require('./BH1750');

var I2C_DEVICE = '/dev/i2c-',
    I2C_BUS_ID = 1,
    UART_DEVICE = '/dev/ttyO',
    UART_ADDRESS_ID = 4;

function DigitalLight(sensorInfo, options) {
  var device, sensOptions;

  logger.info('[DigitalLight/Driver] sensorInfo, options', sensorInfo, options);

  Sensor.call(this, sensorInfo, options);

  if (sensorInfo.model) {
    this.model = sensorInfo.model;
  } else if (options && options.model) {
    this.model = options.model;
  }

  if (sensorInfo.device.sensorNetwork && sensorInfo.device.address) {

    if (sensorInfo.device.sensorNetwork === 'i2c') {
      device = I2C_DEVICE + (sensorInfo.device.bus || I2C_BUS_ID);
    } else if (sensorInfo.device.sensorNetwork === 'uart') {
      device = UART_DEVICE + (sensorInfo.device.address || UART_ADDRESS_ID);
    }

    switch (this.model) {
      case 'TSL2561':
        sensOptions = {
          address: sensorInfo.device.address,
          device: device
        };

        this.wire = new TSL2561(sensOptions);

        this.wire.on('sensorSettingChanged', function (e) {
          logger.debug('[DigitalLight/Driver] sensorSettingChanged', e);
        });
        this.wire.on('sensorSettingFailed', function (e) {
          logger.debug('[DigitalLight/Driver] sensorSettingFailed', e);
        });
        this.wire.on('newSensorValue', function (e) {
          logger.debug('[DigitalLight/Driver] newSensorValue', e);
        });
        this.wire.on('sensorValueError', function (e) {
          logger.debug('[DigitalLight/Driver] sensorValueError', e);
        });

        this.wire.init(function (err, val) {
          if (err) {
            logger.error('[DigitalLight/Driver] TSL2561 - error on sensor init: ', err);
          } else {
            logger.debug('[DigitalLight/Driver] TSL2561 - sensor init completed: ', val);
          }
        });

        break;
      case 'BH1750':
        sensOptions = {
          address: sensorInfo.device.address,
          device: device
        };

        this.wire = new BH1750(sensOptions);

        this.wire.on('sensorSettingChanged', function (e) {
          logger.debug('[DigitalLight/Driver] sensorSettingChanged', e);
        });
        this.wire.on('sensorSettingFailed', function (e) {
          logger.debug('[DigitalLight/Driver] sensorSettingFailed', e);
        });
        this.wire.on('newSensorValue', function (e) {
          logger.debug('[DigitalLight/Driver] newSensorValue', e);
        });
        this.wire.on('sensorValueError', function (e) {
          logger.debug('[DigitalLight/Driver] sensorValueError', e);
        });

        this.wire.init(function (err, val) {
          if (err) {
            logger.error('[DigitalLight/Driver] BH1750 - error on sensor init: ', err);
          } else {
            logger.debug('[DigitalLight/Driver] BH1750 - sensor init completed: ', val);
          }
        });

        break;
      default:
        logger.warn('[DigitalLight/Driver] ' + this.model + ' model is not supported');
    }
  } else {
    logger.warn('[DigitalLight/Driver] sensor network or address is not provided');
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
  idTemplate: '{model}-{gatewayId}-{deviceAddress}',
  maxRetries: 8,
  category: 'sensor'
};

util.inherits(DigitalLight, Sensor);

/*
 * Get the light of a given sensor
 * @param sensor : The sensor ID
 * @param callback : callback (err, {id, value})
*/
DigitalLight.prototype._get = function () {
  var self = this, rtn;

  try {
    switch (this.model) {
      case 'TSL2561':
        this.wire.getLux(function (err, data) {
          if (err) {
            rtn = {status: 'error', id : self.id, message: err.toString()};
          } else {
            rtn = {status: 'ok', id : self.id, result: {'light': data}};
          }

          logger.debug('[DigitalLight/Driver] TSL2561/I2C - data, rtn, info: ', data, rtn, self.info);

          self.emit('data', rtn);
        });

        break;
      case 'BH1750':
        this.wire.getLux(function (err, data) {
          if (err) {
            rtn = {status: 'error', id : self.id, message: err.toString()};
          } else {
            rtn = {status: 'ok', id : self.id, result: {'light': data}};
          }

          logger.debug('[DigitalLight/Driver] BH1750/I2C - data, rtn, info: ', data, rtn, self.info);

          self.emit('data', rtn);
        });

        break;
      default:
        logger.warn('[DigitalLight/Driver] ' + this.model + ' model is not supported');
        rtn = {status: 'error', id : this.id, message: this.model + ' model is not supported'};

        self.emit('data', rtn);
    }
  } catch (e) {
    logger.error('[DigitalLight/Driver] error', e);
  }
};

module.exports = DigitalLight;
