'use strict';
var Gpio = require('onoff').Gpio, // Constructor function for Gpio objects.
    util = require('util'),
    Actuator = require('../').Actuator;

var logger = Actuator.getLogger();

var DEFAULT_BLINK_INTERVAL = 5000;

// PowerSwitch constructor
var PowerSwitch = function (sensorInfo, options) {
  Actuator.call(this, sensorInfo, options);

  if (sensorInfo.device.address) {
    this.gpio = new Gpio(sensorInfo.device.address, 'out');
    logger.info('powerSwitch sensor is created at driver', sensorInfo);
  } else {
    logger.warn('powerSwitch sensor address is not provided');
  }
};

PowerSwitch.properties = {
  supportedNetworks: ['gpio'],
  dataTypes: ['powerSwitch'],
  discoverable: false,
  maxInstances: 5,
  id: '{model}-{macAddress}-{address}',
  model: 'powerSwitch',
  commands: ['on', 'off', 'blink'],
};
util.inherits(PowerSwitch, Actuator);

/* Turn powerSwitch on */
PowerSwitch.prototype.on = function (options, cb) {
  var self = this,
      duration = options && options.duration;

  this._clear();

  if (duration !== undefined && duration <= 0) {
    return cb && typeof cb === 'function' && cb(new Error('duration is not valid'));
  }

  this.gpio.writeSync(1);

  if (duration !== undefined) {
    this.offTimer = setTimeout(function () {
      self.offTimer = null;
      self.off();
    }, duration);
  }

  logger.info('[PowerSwitch] on command with ', options);

  return cb && typeof cb === 'function' && cb(null, this.id + ' is on');
};
/* Turn powerSwitch off */
PowerSwitch.prototype.off = function (options, cb) {
  this._clear();
  this.gpio.writeSync(0);

  logger.info('[PowerSwitch] off command with ', options);
  return cb && typeof cb === 'function' && cb(null, this.id + ' is off');
};
/* Blink 
 * interval: blink interval(default: 1 sec)
 * duration: turn off after duration(default: Infinite)
 */
PowerSwitch.prototype.blink = function (options, cb) {
  var self = this,
      interval = options && options.interval,
      duration = options && options.duration;

  this._clear();

  if (interval !== undefined && interval <= 0) {
    return cb && typeof cb === 'function' && cb(new Error('interval is not valid'));
  }

  if (duration !== undefined && duration <= 0) {
    return cb && typeof cb === 'function' && cb(new Error('duration is not valid'));
  }

  this.blinkTimer = setInterval(function () {
    self.gpio.read(function (err, value) {
      if (err) { throw err; }
      self.gpio.write(value === 0 ? 1 : 0, function (err) {if (err) { throw err; }});
    });
  }, interval || DEFAULT_BLINK_INTERVAL);

  if (duration !== undefined) {
    this.offTimer = setTimeout(function () {
      clearInterval(self.blinkTimer);
      self.blinkTimer = null;
      self.offTimer = null;
      self.off();
    }, duration);
  }

  return cb && typeof cb === 'function' && cb(null, this.id + ' is blinking');
};
/* Clear powerSwitch */
PowerSwitch.prototype._clear = function () {
  if (this.blinkTimer) {
    clearInterval(this.blinkTimer);
    this.blinkTimer = null;
  }
  if (this.offTimer) {
    clearTimeout(this.offTimer);
    this.offTimer = null;
  }
};

module.exports = PowerSwitch;
