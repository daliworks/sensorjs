'use strict';
var url = require('url');

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

function parseSensorUrl(sensorUrl) {
  var parsed = url.parse(sensorUrl);

  if (parsed.protocol !== 'sensorjs:' || !parsed.pathname) { return; }
  var splits = parsed.pathname.split('/');
  return {
    device: {
      protocol: splits[1],
      address: splits[2],
    },
    model: splits[3],
    id: splits[4],
  };
}
exports.parseSensorUrl = parseSensorUrl;

exports.getUrl = function(sensorInfo) {
  return ['sensorjs:', sensorInfo.device, sensorInfo.address, sensorInfo.model, sensorInfo.id].join('/');
};

exports.createSensor = function (sensorUrl, options) {
  var sensorInfo = parseSensorUrl(sensorUrl);
  try {
    var Sensor = getSensorDriver(sensorInfo.model);

    return Sensor && new Sensor(sensorInfo, options);
  } catch (e) {
    logger.error('err=', e.stack);
    return null;
  }
};

var getSensorProperties = exports.getSensorProperties = function (driverName) {
  try {
    var Sensor = getSensorDriver(driverName);

    return Sensor && Sensor.properties;
  } catch (e) {
    logger.error('exp=', e);
    return null;
  }
};

exports.getNetwork = function (networkName, cb) {
  try {
    return require('./network/' + networkName);
  } catch (e) { 
    return cb && cb(new Error('module not found: ' + networkName));
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
  var props = getSensorProperties(driverName),
      networkName = props.supportedNetworks[0], //FIXME: cover multiple network
      network;

  if (typeof options === 'function') { cb = options; }

  if (props.discoverable) {
    try {
      network = require('./network/' + networkName);
      network.discover(driverName, cb);
    } catch (e) { 
      return cb && cb(new Error('module not found: ' + networkName));
    }
  } else {
    return cb && cb(new Error('not discoverable: ' + networkName));
  }
};
