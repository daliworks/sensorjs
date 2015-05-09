'use strict';

var Sensor = require('./index').Sensor,
    util = require('util');
var logger = Sensor.getLogger();

function OnOff(sensorInfo, options, type) {
  Sensor.call(this, sensorInfo, options);
  this.type = type;
  this.init(options.gpioPort);
}

util.inherits(OnOff, Sensor);

OnOff.prototype.init = function (gpioPort) {
  var Gpio = require('onoff').Gpio;

  this._cached = {value: null, rtn: {}};
  this.button = new Gpio(gpioPort, 'in', 'both');

  if (this.button.direction() !== 'in' || this.button.edge() !== 'both') {
    this.button.unexport(); // delete existing gpio configuration and open again.

    this.button = new Gpio(gpioPort, 'in', 'both');
    if (this.button.direction() !== 'in' || this.button.edge() !== 'both') {
      this._cached.rtn = {status: 'error', id: this.id,
        message: 'configuration error gpio=' +  gpioPort};
      logger.error('[OnOff] init failure ', this._cached.rtn.message);
      return;
    }
  }

  this._readValue();

  logger.info('[OnOff] init success', this._cached.rtn.result);
};

OnOff.prototype._readValue = function () {
  var value = this.button.readSync();
  if (value !== 0 && value !== 1) {
    logger.error('[OnOff] invalid value=', value);
    value = 0;
  }

  value = this._convertValue(value);

  this._cached.value = value;
  this._cached.rtn =  {status: 'ok', id: this.id, result: {}};
  this._cached.rtn.result[this.type] = this._cached.value;

  return value;
};

OnOff.prototype._get = function () {
  this.emit('data', this._cached.rtn);
};

OnOff.prototype._convertValue = function (value) {
  return value;
};

OnOff.prototype._enableChange = function () {
  var self = this;

  logger.info('OnOff._enableChange() change first', this._cached.rtn, this.button);

  this.emit('change', this._cached.rtn);

  this.button.watch(function(err, currValue) {
    var previous;

    if (err) {
      logger.error('OnOff._enableChange() watch fail!', self._cached.rtn, self.button);
      return;
    }

    if (self.button) {
      currValue = self._convertValue(currValue);
      if (self._cached.value !== currValue) {
        previous = self._cached.rtn;
        self._cached.rtn =  {status: 'ok', id: self.id, result: {}};
        self._cached.rtn.result[self.type] = currValue;
        self._cached.value = currValue;

        logger.debug('OnOff._enableChange()-watch emit change \ncurren=', self._cached.rtn,
          '\nprevious=', previous);

        self.emit('change', self._cached.rtn, previous);
      }
    }
  });
};

module.exports = OnOff;
