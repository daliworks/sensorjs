'use strict';

var url = require('url'),
    path = require('path'),
    _ = require('lodash'),
    querystring = require('querystring'),
    logger = require('log4js').getLogger('Sensor'),
    Network = require('./network/index'),
    Driver = require('./driver/index');

var _cachedDrivers = {},
    _cachedNetworks = {},
    DRIVER_CFG_PATH = path.join(__dirname, 'driver_cfg.json'),
    DRIVER_CFG = require(DRIVER_CFG_PATH);

var addSensorPackage = function (sensor) {
  var networks, drivers;

  // Step 1. Setup(Assign) super constructors
  _.defaults(sensor, exports);
  sensor.Network = Network;
  sensor.Device = Driver.Device;
  sensor.Sensor = Driver.Sensor;
  sensor.Actuator = Driver.Actuator;

  try {
    // Step 2. Init sensor(child) constructors(network, drivers)
    networks = sensor.initNetworks();
    drivers = sensor.initDrivers();

    // Step 3. Register network and drivers
    _.forEach(sensor.networks, function (networkName) {
      _cachedNetworks[networkName] = networks[networkName];
    });

    _.forEach(sensor.drivers, function (models, driverName) {
      DRIVER_CFG[driverName] = models;

      _.forEach(models, function (model) {
        _cachedDrivers[model] = drivers[driverName];
      });

      _cachedDrivers[driverName] = drivers[driverName];
      logger.info('[sensor/index.js] updated DRIVER_CFG[' + driverName + ']', DRIVER_CFG[driverName]);
    });
  } catch (e) {
    logger.error('[sensor/index.js] addSensorPackage', e);
  }
  
  //log4js log level doesn't apply on init probably
  //logger.debug('[sensor/index.js] _cachedNetworks', _cachedNetworks);
  //logger.debug('[sensor/index.js] _cachedDrivers', _cachedDrivers);
  //logger.debug('[sensor/index.js] added sensor', sensor);
  logger.debug('[sensor/index.js] updated DRIVER_CFG', DRIVER_CFG);
};

var getSensorDriver = function (model) {
  if (!model) {
    return;
  }
  if (_cachedDrivers[model]) {
    return _cachedDrivers[model];
  }
  try {
    _cachedDrivers[model] = require(path.join(__dirname, 'driver', model));
    return _cachedDrivers[model];
  } catch (e) {//try again after driver lookup
    try {
      var driver = _.findKey(DRIVER_CFG, function (models) {
        return _.contains(models, model);
      }); 
      if (driver) {
        _cachedDrivers[model] = require(path.join(__dirname, 'driver', driver));
      } else {
        logger.warn('getSensorDriver() driver not found / lookup driver', model);
      }
      return _cachedDrivers[model];
    } catch (ee) { 
      logger.warn('getSensorDriver() driver not found / model=', model, 'error=', ee);
      throw ee; 
    }
  }
};

var parseSensorUrl = function(sensorUrl) {
  var parsed = url.parse(sensorUrl);

  if (parsed.protocol !== 'sensorjs:' || !parsed.pathname) { return; }
  var splits = parsed.pathname.split('/');
  return {
    device: {
      sensorNetwork: splits[1],
      address: splits[2]
      // TODO: add device id
    },
    model: splits[3],
    id: splits[4],
    options: parsed.query && querystring.parse(parsed.query)
  };
};

var getUrl = function(sensorInfo) {
  var baseUrl = ['sensorjs://', sensorInfo.device.sensorNetwork, 
    sensorInfo.device.address, sensorInfo.model, sensorInfo.id].join('/');
  if (sensorInfo.options) {
    baseUrl += '?' + querystring.stringify(sensorInfo.options);
  }
  return baseUrl;
};

var createSensor = function (sensorUrl, options) {
  var sensorInfo = parseSensorUrl(sensorUrl);
  try {
    var Sensor = getSensorDriver(sensorInfo.model);

    return Sensor && new Sensor(sensorInfo, _.defaults(options || {}, sensorInfo.options));
  } catch (e) {
    logger.error('err=', e.stack);
    return null;
  }
};

var getSensorProperties = function(model) {
  var sensorDriver;

  try {
    sensorDriver = getSensorDriver(model);

    if (sensorDriver && sensorDriver.properties) {
      var props = _.cloneDeep(sensorDriver.properties); // TODO: cloning on demand
      _.each(props, function (v, k) {
        if (_.isObject(v) && _.has(v, model)) {
          props[k] = v[model];
        }
      });
      return props;
    } else {
      return null;
    }
  } catch (e) {
    logger.error('exp=', e);
    return null;
  }
};

var getNetwork = function(networkName) {
  if (_cachedNetworks[networkName]) {
    return _cachedNetworks[networkName];
  }

  try {
    _cachedNetworks[networkName] = require('./network/' + networkName);
    return _cachedNetworks[networkName];
  } catch (e) { 
    console.error('error to get network [%s]', networkName, e);
  }

  return;
};

/**
 * Discover sensor/actuator IDs(or detail info Object) from the given sensor netowrk
 *
 * @param {String} driverName or model
 * @param {Object} options(optional) - TBD
 * @return {Cabllback} error and {Array} array of discovered IDs
*/
exports.discover = function (driverName/*or model*/, options, cb) {
  var networkName, network, props, models;

  if (typeof options === 'function') { cb = options; }

  if (driverName) {
    try {
      models = DRIVER_CFG[driverName];
      if (!models) {
        models = [driverName]; 
      }
      props = getSensorProperties(models[0]);
      networkName = props.supportedNetworks[0];//FIXME: cover multiple network
    } catch (e) { }
  }

  if (!driverName || !props || !networkName) {
    return cb && cb(new Error('invalid param'));  
  }

  if (props.discoverable) {
    network = getNetwork(networkName);

    if (network) {
      network.discover(driverName, cb);
    } else {
      return cb && cb(new Error('module not found: ' + networkName));
    }
  } else {
    return cb && cb(new Error('not discoverable: ' + networkName));
  }
};

exports.getDriverConfig = function () {
  return DRIVER_CFG;
};

exports.addSensorPackage = addSensorPackage;
exports.getSensorDriver = getSensorDriver;
exports.parseSensorUrl = parseSensorUrl;
exports.getUrl = getUrl;
exports.createSensor = createSensor;
exports.getSensorProperties = getSensorProperties;
exports.getNetwork = getNetwork;
