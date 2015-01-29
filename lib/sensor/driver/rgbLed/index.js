'use strict';
var Gpio = require('onoff').Gpio, // Constructor function for Gpio objects.
    util = require('util'),
    Actuator = require('../').Actuator;

var logger = Actuator.getLogger();

var DEFAULT_BLINK_INTERVAL = 1000;

// Led constructor
var Led = function (sensorInfo, options) {
  Actuator.call(this, sensorInfo, options);

  if (sensorInfo.device.address) {
    this.gpio = new Gpio(sensorInfo.device.address, 'out');
    logger.info('Led sensor is created at driver', sensorInfo);
  } else {
    logger.warn('Led sensor address is not provided');
  }
};

Led.properties = {
  supportedNetworks: ['gpio'],
  dataTypes: ['led'],
  discoverable: false,
  addressable: true,
  maxInstances: 5,
  idTemplate: '{model}-{gatewayId}-{deviceAddress}',
  model: 'rgbLed',
  commands: ['on', 'off', 'blink'],
  category: 'actuator'
};
util.inherits(Led, Actuator);

/* Turn LED on */
/* options.duration: infinite if NaN, null, undefined, zero or minus */
Led.prototype.on = function (options, cb) {
  var self = this,
  duration = options && Number(options.duration, 10);

  this._clear();

  if (!duration || duration <= 0) {
    duration = 0; 
  }

  this.gpio.writeSync(1);

  if (duration) {
    this.offTimer = setTimeout(function () {
      self.offTimer = null;
      self.off();
    }, duration);
  }

  logger.info('[rgbLed] on command with ', options);

  return cb && typeof cb === 'function' && cb(null, this.id + ' is on');
};
/* Turn LED off */
Led.prototype.off = function (options, cb) {
  this._clear();
  this.gpio.writeSync(0);

  logger.info('[rgbLed] off command with ', options);
  return cb && typeof cb === 'function' && cb(null, this.id + ' is off');
};
/* Blink 
 * interval: blink interval(default: 5 sec)
 * options.duration: infinite if NaN, null, undefined, zero or minus
 */
Led.prototype.blink = function (options, cb) {
  var self = this,
  interval = options && Number(options.interval, 10),
  duration = options && Number(options.duration, 10);

  this._clear();

  if (!interval || interval <= 0) {
    interval = DEFAULT_BLINK_INTERVAL; 
  }

  if (!duration || duration <= 0) {
    duration = 0; 
  }

  this.blinkTimer = setInterval(function () {
    self.gpio.read(function (err, value) {
      if (err) { throw err; }
      self.gpio.write(value === 0 ? 1 : 0, function (err) {if (err) { throw err; }});
    });
  }, interval || DEFAULT_BLINK_INTERVAL);

  if (duration) {
    this.offTimer = setTimeout(function () {
      clearInterval(self.blinkTimer);
      self.blinkTimer = null;
      self.offTimer = null;
      self.off();
    }, duration);
  }

  return cb && typeof cb === 'function' && cb(null, this.id + ' is blinking');
};
/* Clear LED */
Led.prototype._clear = function () {
  if (this.blinkTimer) {
    clearInterval(this.blinkTimer);
    this.blinkTimer = null;
  }
  if (this.offTimer) {
    clearTimeout(this.offTimer);
    this.offTimer = null;
  }
};

module.exports = Led;
