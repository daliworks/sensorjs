'use strict';

var OnOff = require('../onoff'),
    util = require('util'),
    _ = require('lodash');
var logger = require('../index').Sensor.getLogger();

//logger.setLevel('debug');

var SWITCH_GPIO_NUM = 60;
var GRACE_PERIOD = 10000;
//var MAX_COUNT_IN_GRACE_PERIOD = 10;

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

  this.savedValue = 0;

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

MotionDetector.prototype.__triggerEvent = function(currValue) {
  var self = this;

  if (self.button) {
    var previous = self._cached.rtn;

    self._cached.rtn = {status: 'ok', id: self.id, result: {}};
    self._cached.rtn.result[self.type] = currValue;
    self._cached.value = currValue;

    logger.debug('[MotionDetector] triggerEvent() - emit change \ncurrent =', self._cached.rtn,
    '\nprevious =', previous);

    self.emit('change', self._cached.rtn, previous);
  }
};

MotionDetector.prototype._enableChange = function() {
  var self = this;

  this.emit('change', this._cached.rtn);

  this.button.watch(function(err, currValue) {
    if (err) {
      logger.error('[MotionDetector] enableChange() watch fail!', self._cached.rtn, self.button);
      return;
    }
    logger.debug('[MotionDetector] saved/currValue', self.savedValue, currValue);

    if (self.timer) {
      logger.debug('[MotionDetector] reset timer - value = ', currValue);
      clearTimeout(self.timer);
      self.timer = setTimeout(function() {
        logger.debug('[MotionDetector] timeout');
        self.__triggerEvent(0);
        self.timer = null;
      }, GRACE_PERIOD);
    } else if (currValue === 1) {
      self.__triggerEvent(currValue);
      self.timer = setTimeout(function() {
        logger.debug('[MotionDetector] timeout');
        self.__triggerEvent(0);
        self.timer = null;
      }, GRACE_PERIOD);
    } else {
      logger.debug('[MotionDetector] ignore');
    }
  });
};

MotionDetector.prototype._clear = function() {
  if (this.timer) {
    clearTimeout(this.timer);
    delete this.timer;
  }
};

module.exports = MotionDetector;


