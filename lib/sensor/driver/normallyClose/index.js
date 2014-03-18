'use strict';

var Sensor = require('../').Sensor,
    OnOff = require('../onoff'),
    util = require('util');
var SWITCH_GPIO_NUM = 61;

function MagneticSwitch(sensorInfo, options) {
  if (sensorInfo.model) {
    this.model = sensorInfo.model;
  } else {
    if (options) {
      this.model = options.model;
    }
  }
  if (!options) { options = {}; }

  options.gpioPort = SWITCH_GPIO_NUM;
  OnOff.call(this, sensorInfo, options, 'onoff');
}

MagneticSwitch.properties = {
  supportedNetworks: ['gpio'],
  sensorType: 'magneticSwitch',
  onChange: true,
  discoverable: false,
  recommendedInterval: 30000,
  maxInstances: 1,
  models: ['normallyOpen', 'normallyClose'],
  id: '{model}-{macAddress}',
  maxRetries: 1 
};

util.inherits(MagneticSwitch, OnOff);

MagneticSwitch.prototype._convertValue = function (value) {
  if (this.model === 'normallyOpen') {
    if (value === 0) { value = 1; }
    else { value = 0; }
  }

  return value;
};

module.exports = MagneticSwitch;


