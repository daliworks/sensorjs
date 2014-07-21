'use strict';

var Sensor = require('../').Sensor,
  util = require('util'),
  fs = require('fs'), 
  logger = Sensor.getLogger();

var _cached = {fire: 0, fireTime: -1, retries: 0};

function FireAlarm(sensorInfo, options) {
  Sensor.call(this, sensorInfo, options);
}

var THRESHOLD = 30, // in degree
  POLLING_INTERVAL = 5000, // 5 secs
  REPORT_INTERVAL = 5 * 60000, // 5min
  timer;

// report every REPORT_INTERVAL
// polling temp sensor every POLLING_INTERVAL
//
FireAlarm.properties = {
  supportedNetworks: ['w1'],
  dataTypes: ['onoff'],
  onChange: true,
  discoverable: true,
  recommendedInterval: 60000,
  maxInstances: 10,
  model: 'fireAlarm',
  maxRetries: 8,
  validValueRange: [-55, 155]
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

  if (_cached.onoff !== (temp.result && temp.result.onoff) || 
    (_cached.onoff + REPORT_INTERVAL <= now)) {
    logger.error('FireAlarm change', temp);
    self.emit('change', temp);
  }

  if (_cached.onoff !== temp.onoff) {
    _cached.onoff = temp.onoff;
    _cached.onoff = now;
  }
};

FireAlarm.prototype._enableChange = function () {
  var self = this;
  if (!timer) {
    self.__get(self.checkFire.bind(self));
    timer = setInterval(function () {
      self.__get(self.checkFire.bind(self));
    }, POLLING_INTERVAL);
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
        if (_cached.retries > FireAlarm.properties.maxRetries) {
          rtn = {status: 'error', id : self.id, message: 'crc check failed'};
        } else {
          _cached.retries++;
          process.nextTick(function () {self.__get(); });
          return;
        }
      } 
    }
    _cached.retries = 0;
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
