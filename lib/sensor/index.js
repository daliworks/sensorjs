'use strict';
var _cachedDrivers = {};

var getSensorDriver = exports.getSensorDriver = function (driverName) {
  if (_cachedDrivers[driverName]) {
    return _cachedDrivers[driverName];
  }
  try {
    _cachedDrivers[driverName] = require('./driver/' + driverName + '/');
    return _cachedDrivers[driverName];
  } catch (e) { 
    throw e; 
  }
};
exports.createSensor = function (driverName, id, options) {
  try {
    var Sensor = getSensorDriver(driverName);

    return Sensor && new Sensor(id, options);
  } catch (e) { 
    console.error('err=', e.stack);
    return null;
  }
};

exports.getSensorProperties = function (driverName) {
  try {
    var Sensor = getSensorDriver(driverName);

    return Sensor && Sensor.properties;
  } catch (e) { 
    console.error('exp=', e);
    return null;
  }
};

/**
 * Discover sensor/actuator IDs(or detail info Object) from the given sensor netowrk
 *
 * @param {String} network name(optional)
 * @param {Object} options(optional) - TBD
 * @return {Cabllback} error and {Array} array of discovered IDs
*/
exports.discover = function (networkName, options, cb) {
  var network;

  if (typeof options === 'function') { cb = options; }
  try {
    network = require('./network/' + networkName);
    network.discover(cb);
  } catch (e) { 
    return (cb(new Error('module not found: ' + networkName)));
  }
};
