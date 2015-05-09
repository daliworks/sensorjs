'use strict';

var Sensor = require('../index').Sensor,
    util = require('util'),
    _cached = {retries: 0},
    logger = Sensor.getLogger(),
    X100 = require('./X100'),
    _ = require('lodash');

var I2C_DEVICE = '/dev/i2c-',
    I2C_BUS_ID = 1,
    UART_DEVICE = '/dev/ttyO',
    UART_ADDRESS_ID = 4;

function DigitalCO2(sensorInfo, options) {
  var self = this,
      device, sensOptions,
      latestSuccessResult;

  logger.info('[DigitalCO2/Driver] sensorInfo, options', sensorInfo, options);

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
      case 'X100':
        sensOptions = {
          address: sensorInfo.device.address,
          device: device,
          sensorNetwork: sensorInfo.device.sensorNetwork
        };

        this.wire = new X100(sensOptions);

        this.wire.on('sensorSettingChanged', function (e) {
          logger.debug('[DigitalCO2/Driver] sensorSettingChanged', e);
        });
        this.wire.on('sensorSettingFailed', function (e) {
          logger.debug('[DigitalCO2/Driver] sensorSettingFailed', e);
        });
        this.wire.on('newSensorValue', function (e) {
          logger.debug('[DigitalCO2/Driver] newSensorValue', e);
        });
        this.wire.on('sensorValueError', function (e) {
          logger.debug('[DigitalCO2/Driver] sensorValueError', e);
        });

        this.wire.on('data', function (result) {
          var sentDateGap;          

          if (result && _.isObject(result)) {
            if (result.status === 'ok') {
              latestSuccessResult = result;
            }

            sentDateGap = Date.now() - self._sentDate;

            if (!sentDateGap || (sentDateGap >= DigitalCO2.properties.recommendedInterval)) {
              result.id = self.id;

              // send the latest success result within recommededInterval or the last fail result
              if (latestSuccessResult && latestSuccessResult.status === 'ok') {
                result = latestSuccessResult;
              }

              self._sentDate = Date.now();
              self.rtn = result;

              latestSuccessResult = null;

              //self.emit('change', result);

              logger.debug('[DigitalCO2/Driver] data event from sensor and send chagne', result);
            }
          }
        });

        this.wire.init(function (err, val) {
          if (err) {
            logger.error('[DigitalCO2/Driver] X100 - error on sensor init: ', err);
          } else {
            logger.debug('[DigitalCO2/Driver] X100 - sensor init completed: ', val);
          }
        });

        break;
      default:
        logger.warn('[DigitalCO2/Driver] ' + this.model + ' model is not supported');
    }
  } else {
    logger.warn('[DigitalCO2/Driver] sensor network or address is not provided');
  }
}

DigitalCO2.properties = {
  supportedNetworks: ['i2c', 'uart'],
  dataTypes: ['co2'],
  onChange: false,
  discoverable: false,
  addressable: true,
  recommendedInterval: 30000,
  maxInstances: 10,
  models: ['X100'],
  idTemplate: '{model}-{gatewayId}-{deviceAddress}',
  maxRetries: 8,
  category: 'sensor'
};

util.inherits(DigitalCO2, Sensor);

/*
 * Get the co2 of a given sensor
 * @param sensor : The sensor ID
 * @param callback : callback (err, {id, value})
*/
DigitalCO2.prototype._get = function () {
  var self = this, rtn;

  try {
    switch (this.model) {
      case 'X100':
        switch (this.wire.options.sensorNetwork) {
          case 'i2c':
            this.wire.getDensity(function (err, data) {
              if (err) {
                rtn = {status: 'error', id : self.id, message: err.toString()};
              } else {
                rtn = {status: 'ok', id : self.id, result: {'co2': data}};
              }

              logger.debug('[DigitalCO2/Driver] X100/I2C - data, rtn, info: ', data, rtn, self.info);

              self.emit('data', rtn);
            });

            break;
          case 'uart':
            logger.debug('[DigitalCO2/Driver] X100/UART', this.wire);

            if (this.rtn) {
              logger.debug('[DigitalCO2/Driver] X100/UART with rtn - rtn, info: ', this.rtn, this.info);

              this.emit('data', this.rtn);
            } else {
              this.emit('data', {status: 'off', id : this.id, message: 'CO2 data is not available'});
            }

            break;
          default:
            logger.warn('[DigitalCO2/Driver] ' + this.wire.options.sensorNetwork + ' sensor network is not supported');
            rtn = {
              status: 'error',
              id : this.id,
              message: this.wire.options.sensorNetwork + ' sensor network is not supported'
            };

            self.emit('data', rtn);
        }

        break;
      default:
        logger.warn('[DigitalCO2/Driver] ' + this.model + ' model is not supported');
        rtn = {status: 'error', id : this.id, message: this.model + ' model is not supported'};

        self.emit('data', rtn);
    }
  } catch (e) {
    logger.error('[DigitalCO2/Driver] error', e);
  }
};

module.exports = DigitalCO2;
