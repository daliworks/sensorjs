'use strict';

var util = require('util'),
  noble = require('noble'),
  async = require('async'),
  _ = require('lodash');

//internal lib
var Network = require('../index'),
  sensorDriver = require('../../'),
  Device = require('../../driver/index').Device;

var DEVICE_SCAN_TIMEOUT = 10000,
    DEVICE_CONN_TIMEOUT = 6000,
    SERVICE_DISCOVERY_TIMEOUT = 15000;

var logger = Network.getLogger();

function Ble(options) {
  Network.call(this, 'ble'/*networkName*/, options);
}

util.inherits(Ble, Network);

Ble.prototype.getDevice = function (addr, options, cb) {
  if (typeof options === 'function') {
    cb = options;
  }

  if (!this.underDiscover && noble._peripherals[addr] && noble._peripherals[addr].connected) { //FIXME: check if it's connected?
    return cb && cb(null, [noble._peripherals[addr]]);
  } else {
    //FIXME: new Peripheral, peripheral.connect().
    this._discover(addr, options.model, options.serviceUUIDs || [], options, cb); 
  }
};
Ble.prototype.discover = function (driverName/*or model*/, options, cb) {
  var serviceUUIDs = [],
    props, models;

  if (typeof options === 'function') {
    cb = options;
    options = undefined;
  }
  if (!driverName) {
    driverName = 'sensorTag';
  }

  //get models from driverName
  models = sensorDriver.getDriverConfig()[driverName];
  if (!models) { //find model
    if(_.findKey(sensorDriver.getDriverConfig(), function (models) {
      return _.contains(models, driverName);
    })) {
      models = [driverName];
    } else {
      return cb && cb(new Error('model not found'));
    }
  }
  _.each(models, function (model) {
    try {
      props = sensorDriver.getSensorProperties(model);
    } catch (e) { }
    if (!props || !props[this.sensorNetwork]) {
      return cb && cb(new Error('invalid model:' + model));  
    }
    serviceUUIDs.push(props[this.sensorNetwork].service);
  });
  this._discover(undefined, models, serviceUUIDs, options, cb);
};

Ble.prototype._discover = function (addr, models, serviceUUIDs, options, cb) {
  var self = this;

  if (self.underDiscover) {
    if (cb) {
      cb(new Error('already scanning'));
    } else {
      this.emit('discover', 'error', new Error('already scanning'));
    }
    return;
  }
  self.underDiscover = true;

  var onDiscover = function(peripheral) {
    logger.debug('on discover', peripheral.uuid, peripheral.advertisement);
    self.peripherals.push(peripheral);
  };
  var startScan = function () {
    if (self.scanTimer) {
      logger.error('already startScan');
      return; //already scan
    }
    noble.on('discover', onDiscover);
    noble.startScanning();
    self.scanTimer = setTimeout(function () {
      self.scanTimer = null;
      noble.removeListener('discover', onDiscover);
      noble.stopScanning();
    }, DEVICE_SCAN_TIMEOUT);
  };

  this.peripherals = [];

  noble.once('scanStart', function () {
    logger.debug('on scanStart');
  });
  logger.debug('noble.state', noble.state);
  if (noble.state === 'poweredOn' || noble.state === 'unsupported') {
    startScan();
  } else {
    noble.once('stateChange', function() {
      startScan();
    });
  }
  noble.once('scanStop', function () {
    var founds = [];
    if (self.scanTimer) {
      self.scanTimer = null;
      clearTimeout(self.scanTimer);
    }

    logger.debug('on scanStop');
    if (cb) {
      self.emit('discover', 'scanStop');
    }
    async.each(self.peripherals, function (peripheral, done) {
      if (addr && addr !== peripheral.uuid) {
        logger.error('skip to connect:', peripheral.uuid);
        return done(); //skip
      } 

      var connTimer;
      connTimer = setTimeout(function () {
        try { peripheral.disconnect(); } catch (e) {}
        connTimer = null;
        logger.info('conn timeout', peripheral.uuid);
        done(null, 'conn timeout');
      }, DEVICE_CONN_TIMEOUT);

      peripheral.once('error', function () {
        if (connTimer) {
          try { peripheral.disconnect(); } catch (e) {}
          connTimer = null;
          clearTimeout(connTimer);
        }
        logger.info('on error');
        return done(null, 'on error');
      });

      peripheral.connect(function () {
        var svcTimer;
        logger.debug('connected and find service', peripheral.uuid, peripheral.advertisement);
        if (connTimer) {
          clearTimeout(connTimer);
        } else {
          logger.info('do nothing connect...', peripheral.uuid);
          return; //do nothing already timeout
        }
        svcTimer = setTimeout(function () {
          logger.info('service timeout', peripheral.uuid);
          try { peripheral.disconnect(); } catch (e) {}
          svcTimer = null;
          done(null, 'service timeout');
        }, SERVICE_DISCOVERY_TIMEOUT);

        peripheral.discoverSomeServicesAndCharacteristics(serviceUUIDs, [], function () { // FIXME: discoverService
          var device;
          if (svcTimer) {
            //try { peripheral.disconnect(); } catch (e) {} //FIXME
            clearTimeout(svcTimer);
            svcTimer = null;
          } else {
            logger.info('do nothing... already timer expired', peripheral.uuid);
            return; //do nothing already timeout
          }
          //FIXME: find a model
          device = new Device(self, peripheral.uuid, 
                      [{id:models[0] + '-' + peripheral.uuid, 
                        model: models[0], 
                        deviceHandle: peripheral}]); //not used for now
          founds.push(device);
          self.emit('discovered', device);

          noble._peripherals[device.address].connected = true;       

          peripheral.once('disconnect', function() {
            logger.debug('peripheral disconnect / address=', device.address);
            noble._peripherals[device.address].connected = false;
            self.emit('disconnect', device); 
          });

          return done();
        });
      });
    },function (err, results) {
      if (results) {
        logger.debug('results', results);
      }
      logger.debug('founds', founds);
      self.underDiscover = false;
      return cb && cb(null, founds);
    });
  });
};

module.exports = new Ble();

process.on('uncaughtException', function (/*err*/) {
  return; // ignore, logger.error('[uncaughtException] ' + err.stack);
});
