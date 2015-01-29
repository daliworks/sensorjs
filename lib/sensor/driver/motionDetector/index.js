'use strict';

var OnOff = require('../onoff'),
    util = require('util'),
    _ = require('lodash');

var SWITCH_GPIO_NUM = 60;

// MotionDetector (model: PassiveInfrared) constructor
var MotionDetector = function(sensorInfo, options) {
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
    console.warn('MotionDetector sensor address is not provided');
  }

  OnOff.call(this, sensorInfo, options, 'motion');
};

MotionDetector.properties = {
  supportedNetworks: ['gpio'],
  dataTypes: ['motion'],
  onChange: true,
  discoverable: false,
  addressable: true,
  recommendedInterval: 60000,
  maxInstances: 1,
  models: ['passiveInfrared'],
  idTemplate: '{model}-{gatewayId}-{deviceAddress}',
  maxRetries: 1,
  category: 'sensor'
};

util.inherits(MotionDetector, OnOff);

module.exports = MotionDetector;


