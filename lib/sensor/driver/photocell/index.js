'use strict';

var Sensor = require('../index').Sensor,
    util = require('util'),
    fs = require('fs'), 
    _cached = {retries: 0},
    logger = Sensor.getLogger();

var ocpPaths = [
  '/sys/devices/ocp.2/helper.15',
  '/sys/devices/ocp.3/helper.16'
];

// TODO: calculate lux from the measured analog input(0 ~ 1800 in the case of Beaglebone black analog input)
function getLux(volMeasured) {
  var lux;

  lux = parseInt(volMeasured, 10);

  lux = 2.3 * lux - 3200;
  lux = lux >= 0 ? lux : 0;

  return lux;
}

function Photocell(sensorInfo, options) {
  Sensor.call(this, sensorInfo, options);
}

Photocell.properties = {
  supportedNetworks: ['analog'],
  dataTypes: ['light'],
  onChange: false,
  discoverable: false,
  addressable: true,
  recommendedInterval: 60000,
  maxInstances: 1,
  model: 'photocell',
  idTemplate: '{model}-{gatewayId}-{deviceAddress}',
  maxRetries: 8,
  address: 2,
  category: 'sensor'
};

util.inherits(Photocell, Sensor);

/*
 * Get the light of a given sensor
 * @param sensor : The sensor ID
 * @param callback : callback (err, {id, value})
*/
Photocell.prototype._get = function () {
  var self = this, rtn;

  if (!_cached.ocpPath) {
    ocpPaths.forEach(function (ocpPath) {
      if (fs.existsSync(ocpPath)) {
        _cached.ocpPath = ocpPath;
        return false;
      }
    });
  }

  fs.readFile(_cached.ocpPath + '/AIN' + (this.info.address || Photocell.properties.address),
      'utf8', function (err, data) {
    if (err) {
      rtn = {status: 'off', id : self.id, message: err.toString()};
    } else {
      rtn = {status: 'ok', id : self.id, result: {'light': getLux(data)}};
    }
  
    logger.info('[photocell] data, rtn, info.address, properties.address, ocpPath - ', 
        data, rtn, self.info.address, Photocell.properties.address, _cached.ocpPath);

    self.emit('data', rtn);
  });
};

module.exports = Photocell;
