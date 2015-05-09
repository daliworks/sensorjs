'use strict';

var Sensor = require('../index').Sensor,
  util = require('util'),
  fs = require('fs'), 
  _cached = {retries: 0};

function Ds18b20(sensorInfo, options) {
  Sensor.call(this, sensorInfo, options);
}

Ds18b20.properties = {
  supportedNetworks: ['w1'],
  dataTypes: ['temperature'],
  onChange: false,
  discoverable: true,
  addressable: false,
  recommendedInterval: 60000,
  maxInstances: 10,
  model: 'ds18b20',
  maxRetries: 8,
  validValueRange: [-55, 125],
  category: 'sensor'
};

util.inherits(Ds18b20, Sensor);

/*
 * Get the temperature of a given sensor
 * @param sensor : The sensor ID
 * @param callback : callback (err, {id, value})
*/
Ds18b20.prototype._get = function () {
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
          } else if (degree < Ds18b20.properties.validValueRange[0] ||
                     degree > Ds18b20.properties.validValueRange[1]) {
            rtn = {status: 'error', id : self.id, message: 'invalid range'};
          } else {
            rtn = {status: 'ok', id : self.id, result: {'temperature': degree}};
          }
        } else { // crc okay but invalid output
          rtn = {status: 'error', id : self.id, message: 'invalid output'};
        }
      } else { // crc Check failed
        if (_cached.retries > Ds18b20.properties.maxRetries) {
          rtn = {status: 'error', id : self.id, message: 'crc check failed'};
        } else {
          _cached.retries++;
          process.nextTick(function () {self._get(); });
          return;
        }
      } 
    }
    _cached.retries = 0;
    self.emit('data', rtn);
  });
};

module.exports = Ds18b20;
