'use strict';

var Sensor = require('../index').Sensor,
  util = require('util'),
  fs = require('fs'), 
  logger = Sensor.getLogger();

function FireAlarm(sensorInfo, options) {
  Sensor.call(this, sensorInfo, options);
  this._cached = {onoff: 0, onoffTime: -1, retries: 0};

}

var THRESHOLD = 45, // in degree
  POLLING_INTERVAL = 5000, // 5 secs
  REPORT_INTERVAL = 30 * 60000; // 30min

// report every REPORT_INTERVAL
// polling temp sensor every POLLING_INTERVAL
//
FireAlarm.properties = {
  supportedNetworks: ['w1'],
  dataTypes: ['onoff'],
  onChange: true,
  discoverable: true,
  addressable: false,
  recommendedInterval: 60000,
  maxInstances: 10,
  model: 'fireAlarm',
  maxRetries: 8,
  validValueRange: [-55, 155],
  category: 'sensor'
};

util.inherits(FireAlarm, Sensor);

FireAlarm.prototype.checkFire = function(err, temp) {
  var self = this,
    now = Date.now();

  if (temp && temp.status === 'ok') {
    if ( temp.result.temperature >= THRESHOLD) {
      temp.result.onoff = 1;
    } else {
      temp.result.onoff = 0;
    }
  } else {
    if (!temp) { temp = {status: 'error'}; }
  }

  if (this._cached.onoff !== (temp.result && temp.result.onoff) || 
    (this._cached.onoffTime + REPORT_INTERVAL <= now)) {
    logger.debug('fireAlarm change', temp);
    self.emit('change', temp);
    this._cached.onoff = temp.result.onoff;
    this._cached.onoffTime = now;
  }
};

FireAlarm.prototype._enableChange = function () {
  var self = this;

  if (!this.timer) {
    self.__get(self.checkFire.bind(self));
    this.timer = setInterval(function () {
      self.__get(self.checkFire.bind(self));
    }, POLLING_INTERVAL);
  }
};

FireAlarm.prototype._clear = function () {
  if (this.timer) {
    clearInterval(this.timer);
    delete this.timer;
  }
};

/*
 * Get the temperature of a given sensor
*/
FireAlarm.prototype.__get = function (cb) {
  var self = this, rtn;

  fs.readFile('/sys/bus/w1/devices/' + this.id + '/w1_slave', 'utf8', function (err, data) {
    if (err) {
      rtn = {status: 'off', id : self.id, message: err.toString()};
    } else {
      var crcOk = data.match(/YES/g); 
      
      if (crcOk) {
        var output = data.match(/t=(\-?\d+)/i);
        if (output) {
          var degree = output[1] / 1000;
          if (parseInt(output[1], 10) === 85000) { // The power-on reset value is +85 degree 
            rtn = {status: 'error', id : self.id, message: 'power on'};
          } else if (degree < FireAlarm.properties.validValueRange[0] ||
                     degree > FireAlarm.properties.validValueRange[1]) {
            rtn = {status: 'error', id : self.id, message: 'invalid range'};
          } else {
            rtn = {status: 'ok', id : self.id, result: {'temperature':  degree}};
          }
        } else { // crc okay but invalid output
          rtn = {status: 'error', id : self.id, message: 'invalid output'};
        }
      } else { // crc Check failed
        if (self._cached.retries > FireAlarm.properties.maxRetries) {
          rtn = {status: 'error', id : self.id, message: 'crc check failed'};
        } else {
          self._cached.retries++;
          process.nextTick(function () {self.__get(); });
          return;
        }
      } 
    }
    self._cached.retries = 0;
    return cb && cb(null, rtn);
  });
};

FireAlarm.prototype._get = function () {
  var self = this;
  self.__get(function(err, rtn) {
    self.emit('data', rtn);
  });
};

module.exports = FireAlarm;
