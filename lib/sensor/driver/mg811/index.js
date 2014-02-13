'use strict';

var Sensor = require('../').Sensor,
    util = require('util'),
    fs = require('fs'), 
    _cached = {retries: 0},
    logger = Sensor.getLogger();

var ocpPaths = [
  '/sys/devices/ocp.2/helper.15',
  '/sys/devices/ocp.3/helper.16'
];

function Mg811(sensorInfo, options) {
  Sensor.call(this, sensorInfo, options);
}

Mg811.properties = {
  supportedNetworks: ['analog'],
  sensorType: 'co2',
  onChange: false,
  discoverable: false,
  recommendedInterval: 10000,
  maxInstances: 1,
  model: 'mg811',
  id: '{model}-{macAddress}',
  maxRetries: 8,
  address: 0
};

util.inherits(Mg811, Sensor);

/*
 * Get the CO2 of a given sensor
 * @param sensor : The sensor ID
 * @param callback : callback (err, {id, value})
*/
Mg811.prototype._get = function () {
  var self = this, rtn;

  if (!_cached.ocpPath) {
    ocpPaths.forEach(function (ocpPath) {
      if (fs.existsSync(ocpPath)) {
        _cached.ocpPath = ocpPath;
        return false;
      }
    });
  }

  fs.readFile(_cached.ocpPath + '/AIN' + (this.info.address || Mg811.properties.address),
      'utf8', function (err, data) {
    if (err) {
      rtn = {status: 'off', id : self.id, message: err.toString()};
    } else {
      rtn = {status: 'ok', id : self.id, result: {'co2': parseInt(data, 10)}};
    }
    self.emit('data', rtn);
  });
};

module.exports = Mg811;
