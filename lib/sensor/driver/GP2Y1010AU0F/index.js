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

function getDensity(volMeasured) {
  var calcVoltage, dustDensity;
  
  // 0 ~ 1800(1.8V ADC volt of Beaglebone black) mapped to 0 ~ 1024 integer valeus
  calcVoltage = volMeasured * 1024 / 1800; 

  // linear eqaution taken from http://www.howmuchsnow.com/arduino/airquality/
  // Chris Nafis (c) 2012
  dustDensity = 0.17 * calcVoltage - 0.1;

  return Math.round(dustDensity);
}

function GP2Y1010AU0F(sensorInfo, options) {
  Sensor.call(this, sensorInfo, options);
}

GP2Y1010AU0F.properties = {
  supportedNetworks: ['analog'],
  dataTypes: ['dust'],
  onChange: false,
  discoverable: false,
  addressable: true,
  recommendedInterval: 60000,
  maxInstances: 1,
  model: 'GP2Y1010AU0F',
  idTemplate: '{model}-{gatewayId}-{deviceAddress}',
  maxRetries: 1,
  address: 1,
  category: 'sensor'
};

util.inherits(GP2Y1010AU0F, Sensor);

/*
 * Get the dust of a given sensor
 * @param sensor : The sensor ID
 * @param callback : callback (err, {id, value})
*/
GP2Y1010AU0F.prototype._get = function () {
  var self = this, rtn;

  if (!_cached.ocpPath) {
    ocpPaths.forEach(function (ocpPath) {
      if (fs.existsSync(ocpPath)) {
        _cached.ocpPath = ocpPath;
        return false;
      }
    });
  }

  fs.readFile(_cached.ocpPath + '/AIN' + (this.info.address || GP2Y1010AU0F.properties.address),
      'utf8', function (err, data) {
    var density;

    if (err) {
      rtn = {status: 'off', id : self.id, message: err.toString()};
    } else {
      density = getDensity(parseInt(data, 10));

      rtn = {status: 'ok', id : self.id, result: {'dust': density}};
    }

    logger.info('[GP2Y1010AU0F-Dust] data, rtn, info.address, properties.address, ocpPath - ', 
        data, rtn, self.info.address, GP2Y1010AU0F.properties.address, _cached.ocpPath);

    self.emit('data', rtn);
  });
};

module.exports = GP2Y1010AU0F;
