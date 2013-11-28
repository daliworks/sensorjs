'use strict';

var Sensor = require('../').Sensor,
    util = require('util');
var logger = Sensor.getLogger(),
    onoffVal = ['off', 'on'],
    _cached = {value: null, rtn: {}};

function Onoff(id, options) {
  Sensor.call(this, id, options);
  this.model = (options && options.model && options.model === 'onoff') ? 'onoff' : 'offon';
  this.init();
}

Onoff.properties = {
  supportedNetworks: ['gpio'],
  sensorType: 'onoff',
  onChange: true,
  discoverable: false,
  recommendedInterval: 0,
  maxInstances: 1,
  models: ['onoff', 'onon'],
  id: '{model}-{macAddress}',
  maxRetries: 1 
};

util.inherits(Onoff, Sensor);

Onoff.prototype.init = function () {
  var Gpio = require('onoff').Gpio, SWITCH_GPIO_NUM = 69;
  this.button = new Gpio(SWITCH_GPIO_NUM, 'in', 'both', {persistentWatch: true});

  if (this.button.direction() !== 'in' || this.button.edge() !== 'both') {
    this.button.unexport(); // delete existing gpio configuration and open again.

    this.button = new Gpio(SWITCH_GPIO_NUM, 'in', 'both', {persistentWatch: true});
    if (this.button.direction() !== 'in' || this.button.edge() !== 'both') {
      _cached.rtn = {status: 'error', id: this.id,
        message: 'configuration error gpio=' +  SWITCH_GPIO_NUM};
      logger.error('[Onoff] init failure ', _cached.rtn.message);
      return;
    }
  }
  _cached.value = onoffVal[this.button.readSync()];
  _cached.rtn =  {status: 'ok', id: this.id, result: {'onoff': _cached.value}};
  logger.info('[Onoff] init success', _cached.rtn.result);
};

Onoff.prototype._get = function () {
  this.emit('data', _cached.rtn);
};

Onoff.prototype.get = function () {
  this._get();
};

Onoff.prototype._enableChange = function () {
  var currValue;
  var self = this;

  logger.info('change first', _cached.rtn, self.button);
  self.emit('change', _cached.rtn);

  setInterval(function () {
    if (self.button) {
      currValue = onoffVal[self.button.readSync()]; 
      if (_cached.value !== currValue) {
        _cached.rtn =  {status: 'ok', id: self.id, result: {'onoff': currValue}};
        _cached.value = currValue;
        self.emit('change', _cached.rtn);
      }
    }
  }, 200);
};

exports = module.exports = Onoff;
/*
(function (callback) {
  var Gpio = require('onoff').Gpio,  
  SWITCH_GPIO_NUM = 69,
  button = new Gpio(SWITCH_GPIO_NUM, 'in', 'both', {persistentWatch: true});

  if (button.direction() !== 'in' || button.edge() !== 'both') {

    // delete existing gpio configuration and open again.
    button.unexport();
    button = new Gpio(SWITCH_GPIO_NUM, 'in', 'both', {persistentWatch: true});
    if (button.direction() !== 'in' || button.edge() !== 'both') {
      return callback(new Error('gpio config'), {
        status: 'error',
        message: 'configuration error gpio=' +  SWITCH_GPIO_NUM
      });
    }
  }

  //return existing value
  callback(null, {
    status: 'ok',
    result: {"switch": button.readSync()}
  });

  button.watch(function (err, value) {
    if (err) { 
      return callback(new Error('watch'), {
        status: 'error',
        message: err.toString()
      });
    }
    return callback(null, {
      status: 'ok',
      result: {"switch": value}
    });
    //button.unexport();
  });
})(function (err, result) {
  console.log("err=", err, "result=", result);
});
*/

