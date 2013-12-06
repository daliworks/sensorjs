'use strict';

var Sensor = require('../').Sensor,
    OnOff = require('../onoff'),
    util = require('util');
var SWITCH_GPIO_NUM = 61;

function MagneticSwitch(id, options) {
  this.model = (options && options.model && options.model === 'Normally Open') ?
    'Normally Open' : 'Normally Close';

  options.gpioPort = SWITCH_GPIO_NUM;
  OnOff.call(this, id, 'onoff', options);
}

MagneticSwitch.properties = {
  supportedNetworks: ['gpio'],
  sensorType: 'magneticSwitch',
  onChange: true,
  discoverable: false,
  recommendedInterval: 30000,
  maxInstances: 1,
  models: ['Normally Open', 'Normally Close'],
  id: '{model}-{macAddress}',
  maxRetries: 1 
};

util.inherits(MagneticSwitch, OnOff);

MagneticSwitch.prototype._convertValue = function (value) {
  if (this.model === 'Normally Open') {
    if (value === 0) { value = 1; }
    else { value = 0; }
  }

  return value;
};

module.exports = MagneticSwitch;


