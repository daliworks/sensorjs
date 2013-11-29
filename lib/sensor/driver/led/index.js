'use strict';
var Gpio = require('onoff').Gpio, // Constructor function for Gpio objects.
  util = require('util'),
  Actuator = require('../').Actuator;

// Led constructor
var Led = function (gpioNum/*, options*/) {
  this.gpio = new Gpio(gpioNum, 'out');
};

Led.properties = {
  supportedNetworks: ['gpio'],
  actuatorType: 'led',
  discoverable: false,
  maxInstances: 5,
  id: '{model}-{macAddress}',
  model: 'rgbLED',
  commands: ['on', 'off', 'blink'],
};
util.inherits(Led, Actuator);

/* Turn LED on */
Led.prototype.on = function () {
  this._clear();
  this.gpio.writeSync(1);
};
/* Turn LED off */
Led.prototype.off = function () {
  this._clear();
  this.gpio.writeSync(0);
};
/* Blink 
 * interval: blink interval(default: 1 sec)
 * duration: turn off after duration(default: Infinite)
 */
Led.prototype.blink = function (interval, duration) {
  var self = this;
  if (this.blinkTimer) { clearInterval(this.blinkTimer); }
  if (this.offTimer) { clearInterval(this.offTimer); }
  if (interval !== undefined && interval <= 0) {
    return;
  }
  if (duration !== undefined && duration <= 0) {
    return;
  }
  this.blinkTimer = setInterval(function () {
    self.gpio.read(function (err, value) {
      if (err) { throw err; }
      self.gpio.write(value === 0 ? 1 : 0, function (err) {if (err) { throw err; }});
    });
  }, interval || 1000);

  if (duration !== undefined) {
    this.offTimer = setTimeout(function () {
      clearInterval(self.blinkTimer);
      self.blinkTimer = null;
      self.offTimer = null;
      self.off();
    }, duration);
  }
};
/* Turn LED off */
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
