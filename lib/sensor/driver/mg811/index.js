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

// TODO: calculate ppm from the measured analog input(0 ~ 1800 in the case of Beaglebone black analog input)
function getPPM(volMeasured) {
  var ppm;

  ppm = parseInt(volMeasured, 10);

  return ppm;
}

function Mg811(sensorInfo, options) {
  Sensor.call(this, sensorInfo, options);
}

Mg811.properties = {
  supportedNetworks: ['analog'],
  dataTypes: ['co2'],
  onChange: false,
  discoverable: false,
  addressable: true,
  recommendedInterval: 60000,
  maxInstances: 1,
  model: 'mg811',
  idTemplate: '{model}-{gatewayId}-{deviceAddress}',
  maxRetries: 8,
  address: 0,
  category: 'sensor'
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
      rtn = {status: 'ok', id : self.id, result: {'co2': getPPM(data)}};
    }

    logger.info('[MG811-CO2] data, rtn, info.address, properties.address, ocpPath - ', 
        data, rtn, self.info.address, Mg811.properties.address, _cached.ocpPath);

    self.emit('data', rtn);
  });
};

module.exports = Mg811;
