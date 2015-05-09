'use strict';

var Sensor = require('../index').Sensor,
    util = require('util'),
    _cached = {retries: 0},
    logger = Sensor.getLogger(),
    HTU21D = require('./HTU21D');

var I2C_DEVICE = '/dev/i2c-',
    I2C_BUS_ID = 1,
    UART_DEVICE = '/dev/ttyO',
    UART_ADDRESS_ID = 4;

function DigitalHumidity(sensorInfo, options) {
  var device, sensOptions;

  logger.info('[DigitalHumidity/Driver] sensorInfo, options', sensorInfo, options);

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
      case 'HTU21D':
        sensOptions = {
          address: sensorInfo.device.address,
          device: device,
          command: 'Trigger_Humidity_Hold_Master'
        };

        this.wire = new HTU21D(sensOptions);

        this.wire.on('sensorSettingChanged', function (e) {
          logger.debug('[DigitalHumidity/Driver] sensorSettingChanged', e);
        });
        this.wire.on('sensorSettingFailed', function (e) {
          logger.debug('[DigitalHumidity/Driver] sensorSettingFailed', e);
        });
        this.wire.on('newSensorValue', function (e) {
          logger.debug('[DigitalHumidity/Driver] newSensorValue', e);
        });
        this.wire.on('sensorValueError', function (e) {
          logger.debug('[DigitalHumidity/Driver] sensorValueError', e);
        });

        this.wire.init(function (err, val) {
          if (err) {
            logger.error('[DigitalHumidity/Driver] HTU21D - error on sensor init: ', err);
          } else {
            logger.debug('[DigitalHumidity/Driver] HTU21D - sensor init completed: ', val);
          }
        });

        break;
      default:
        logger.warn('[DigitalHumidity/Driver] ' + this.model + ' model is not supported');
    }
  } else {
    logger.warn('[DigitalHumidity/Driver] sensor network or address is not provided');
  }
}

DigitalHumidity.properties = {
  supportedNetworks: ['i2c'],
  dataTypes: ['humidity'],
  onChange: false,
  discoverable: false,
  addressable: true,
  recommendedInterval: 30000,
  maxInstances: 10,
  models: ['HTU21D'],
  idTemplate: '{model}-{gatewayId}-{deviceAddress}',
  maxRetries: 8,
  category: 'sensor'
};

util.inherits(DigitalHumidity, Sensor);

/*
 * Get the light of a given sensor
 * @param sensor : The sensor ID
 * @param callback : callback (err, {id, value})
*/
DigitalHumidity.prototype._get = function () {
  var self = this, rtn;

  try {
    switch (this.model) {
      case 'HTU21D':
        this.wire.getPercent(function (err, data) {
          if (err) {
            rtn = {status: 'error', id : self.id, message: err.toString()};
          } else {
            rtn = {status: 'ok', id : self.id, result: {'humidity': data}};
          }

          logger.debug('[DigitalHumidity/Driver] HTU21D/I2C - data, rtn, info: ', data, rtn, self.info);

          self.emit('data', rtn);
        });

        break;
      default:
        logger.warn('[DigitalHumidity/Driver] ' + this.model + ' model is not supported');
        rtn = {status: 'error', id : this.id, message: this.model + ' model is not supported'};

        self.emit('data', rtn);
    }
  } catch (e) {
    logger.error('[DigitalHumidity/Driver] error', e);
  }
};

module.exports = DigitalHumidity;
