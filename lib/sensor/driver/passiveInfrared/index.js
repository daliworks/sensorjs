'use strict';

var OnOff = require('../onoff'),
    util = require('util');
var SWITCH_GPIO_NUM = 60;

function PIR(sensorInfo, options) {
  if (sensorInfo.model) {
    this.model = sensorInfo.model;
  } else {
    if (options) {
      this.model = options.model;
    }
  }
  if (!options) { options = {}; }

  options.gpioPort = SWITCH_GPIO_NUM;
  OnOff.call(this, sensorInfo, options, 'motion');
}

PIR.properties = {
  supportedNetworks: ['gpio'],
  sensorType: 'motionDetector',
  onChange: true,
  discoverable: false,
  recommendedInterval: 30000,
  maxInstances: 1,
  models: ['passiveInfrared'],
  id: '{model}-{macAddress}',
  maxRetries: 1 
};

util.inherits(PIR, OnOff);

module.exports = PIR;


