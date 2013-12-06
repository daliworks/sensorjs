'use strict';

var OnOff = require('../onoff'),
    util = require('util');
var SWITCH_GPIO_NUM = 60;

function PIR(id, options) {
  this.model = options.model;

  options.gpioPort = SWITCH_GPIO_NUM;
  OnOff.call(this, id, 'motion', options);
}

PIR.properties = {
  supportedNetworks: ['gpio'],
  sensorType: 'motionDetector',
  onChange: true,
  discoverable: false,
  recommendedInterval: 30000,
  maxInstances: 1,
  models: ['Passive Infrared'],
  id: '{model}-{macAddress}',
  maxRetries: 1 
};

util.inherits(PIR, OnOff);

module.exports = PIR;


