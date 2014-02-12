'use strict';
var url = require('url');

var _cachedDrivers = {},
    logger = console;

var getSensorDriver = exports.getSensorDriver = function (model) {
  if (_cachedDrivers[model]) {
    return _cachedDrivers[model];
  }
  try {
    _cachedDrivers[model] = require('./driver/' + model + '/');
    return _cachedDrivers[model];
  } catch (e) {
    logger.warn('getSensorDriver() driver not found / model=', model);
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

var getSensorProperties = exports.getSensorProperties = function (model) {
  try {
    var Sensor = getSensorDriver(model);

    return Sensor && Sensor.properties;
  } catch (e) {
    logger.error('exp=', e);
    return null;
  }
};

exports.getNetwork = function (networkName) {
  try {
    return require('./network/' + networkName);
  } catch (e) { 
    console.error('error to get network [%s]', networkName, e);
  }
  return;
};
/**
 * Discover sensor/actuator IDs(or detail info Object) from the given sensor netowrk
 *
 * @param {String} model
 * @param {Object} options(optional) - TBD
 * @return {Cabllback} error and {Array} array of discovered IDs
*/
exports.discover = function (model, options, cb) {
  var networkName, network, props;

  if (typeof options === 'function') { cb = options; }

  if (model) {
    try {
      props = getSensorProperties(model);
      networkName = props.supportedNetworks[0];//FIXME: cover multiple network
    } catch (e) { }
  }

  if (!model || !props || !networkName) {
    return cb && cb(new Error('invalid param'));  
  }

  if (props.discoverable) {
    try {
      network = require('./network/' + networkName);
      network.discover(model, cb);
    } catch (e) { 
      return cb && cb(new Error('module not found: ' + networkName));
    }
  } else {
    return cb && cb(new Error('not discoverable: ' + networkName));
  }
};
