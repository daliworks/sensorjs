'use strict';
var _cachedDrivers = {},
    logger = console;

var getSensorDriver = exports.getSensorDriver = function (driverName) {
  if (_cachedDrivers[driverName]) {
    return _cachedDrivers[driverName];
  }
  try {
    _cachedDrivers[driverName] = require('./driver/' + driverName + '/');
    return _cachedDrivers[driverName];
  } catch (e) {
    logger.warn('getSensorDriver() driver not found / driverName=', driverName);
    throw e; 
  }
};

exports.createSensor = function (driverName, id, options) {
  try {
    var Sensor = getSensorDriver(driverName);

    return Sensor && new Sensor(id, options);
  } catch (e) {
    logger.error('err=', e.stack);
    return null;
  }
};

exports.getSensorProperties = function (driverName) {
  try {
    var Sensor = getSensorDriver(driverName);

    return Sensor && Sensor.properties;
  } catch (e) {
    logger.error('exp=', e);
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
exports.discover = function (driverName/*model*/, options, cb) {
  var props = getSensorDriver(driverName).supportedNetworks,
      networkName = props.supportedNetworks[0], //FIXME: cover multiple network
      network;

  if (typeof options === 'function') { cb = options; }

  if (props.discoverable) {
    try {
      network = new require('./network/' + networkName);
      network.discover(cb);
    } catch (e) { 
      return (cb(new Error('module not found: ' + networkName)));
    }
  } else {
    return (cb(new Error('not discoverable: ' + networkName)));
  }
};
