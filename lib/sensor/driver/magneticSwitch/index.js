'use strict';

var OnOff = require('../onoff'),
    util = require('util'),
    _ = require('lodash');

var SWITCH_GPIO_NUM = 61;

// MagneticSwitch constructor
var MagneticSwitch = function(sensorInfo, options) {
  var gpioNum;

  if (sensorInfo.model) {
    this.model = sensorInfo.model;
  } else {
    if (options) {
      this.model = options.model;
    }
  }
  if (!options) { options = {}; }

  options.gpioPort = SWITCH_GPIO_NUM;
  gpioNum = Number(sensorInfo.device.address, 10);

  if (!_.isNaN(gpioNum)) {
    options.gpioPort = gpioNum;
  } else {
    console.warn('MagneticSwitch sensor address is not provided');
  }

  OnOff.call(this, sensorInfo, options, 'onoff');
};

MagneticSwitch.properties = {
  supportedNetworks: ['gpio'],
  dataTypes: ['onoff'],
  onChange: true,
  discoverable: false,
  addressable: true,
  recommendedInterval: 60000,
  maxInstances: 1,
  models: ['normallyOpen', 'normallyClose'],
  idTemplate: '{model}-{gatewayId}-{deviceAddress}',
  maxRetries: 1,
  category: 'sensor'
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


