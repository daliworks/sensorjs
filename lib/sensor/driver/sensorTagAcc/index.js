'use strict';

var util = require('util'),
    _ = require('lodash');
var sensorDriver = require('../../'),
    Sensor = require('../').Sensor;
    
var logger = Sensor.getLogger();

var ble;
function SensorTagAcc(sensorInfo, options) {
  Sensor.call(this, sensorInfo, options);
  if (sensorInfo.model) {
    this.model = sensorInfo.model;
  } 
  ble = sensorDriver.getNetwork('ble');
  console.error('SensorTagAcc', sensorInfo);
}

SensorTagAcc.properties = {
  supportedNetworks: ['ble'],
  dataTypes: ['accelerometer'],
  onChange: false, // FIXME: app.listen
  discoverable: true,
  recommendedInterval: 1000, // 1000 miliseconds 
  validCachedValueTimeout: 7000,
  maxInstances: 1,
  models: ['sensorTagAcc'],
  ble: {
    service:'f000aa1004514000b000000000000000',
    config: 'f000aa1204514000b000000000000000',
    data:   'f000aa1104514000b000000000000000',
    period: 'f000aa1304514000b000000000000000'
  },
  id: '{model}-{macAddress}', // id generation template
};

util.inherits(SensorTagAcc, Sensor);

SensorTagAcc.prototype.readAccData = function(cb) {
  var service, dataChar, configChar;
  service = this.deviceHandle && this.deviceHandle.services && 
        _.find(this.deviceHandle.services, {uuid: SensorTagAcc.properties.ble.service});
  if (service && service.characteristics) {
    dataChar = _.find(service.characteristics, {uuid: SensorTagAcc.properties.ble.data});
    configChar = _.find(service.characteristics, {uuid: SensorTagAcc.properties.ble.config});
  }

  if (dataChar && configChar) {
    logger.debug('enable data'); 
    // to enable Characteristic
    configChar.write(new Buffer([0x01]), false, function () { // FIXME: config first time only, error handling(timeout)
      logger.debug('data read'); 
      dataChar.read(function (err, data) {
        if (!err && data) {
          var x = data.readInt8(0) * 4.0 / 256.0;
          var y = data.readInt8(1) * 4.0 / 256.0;
          var z = data.readInt8(2) * 4.0 / 256.0;
          var accelerometer = {x: x, y: y, z: z};
          logger.debug('accelerometer', accelerometer);
          return cb && cb(null, accelerometer);
        } else {
          return cb && cb(err);
        }
      });
    });
  } else {
    return cb && cb (new Error('service or charateristics not found'));
  }
};

SensorTagAcc.prototype._get = function () {
  var result = {};
  var self = this;
  if (this.deviceHandle) {
    logger.debug('w/ deviceHandle');
    this.readAccData(function (err, data) {
      if (err) {
        self.emit('data', {status: 'error', id : self.id, message: err || 'read error'});
      } else {
        result[_.first(SensorTagAcc.properties.dataTypes)] = data;
        self.emit('data', {status: 'ok', id: self.id, result: result});
      }
    });
  } else {
    logger.debug('getDevice');
    ble.getDevice(this.info.device.address, 
      {driverName: 'SensorTagAcc', serviceUUIDs: [SensorTagAcc.properties.ble.service]}, 
      function (err, devices) {

        if (!err && !_.isEmpty(devices)) {
          logger.debug('got device');
          if (devices[0].deviceHandle) {
            //property : ex) 'sensorTagAcc-bc6a29ac16ca'
            self.deviceHandle = devices[0].deviceHandle[self.model + '-' + self.info.device.address]; 
          } else {
            self.deviceHandle = devices[0]; 
          }
          self.readAccData(function (err, data) {
            if (err) {
              self.emit('data', {status: 'error', id : self.id, message: err || 'read error'});
            } else {
              result[_.first(SensorTagAcc.properties.dataTypes)] = data;
              self.emit('data', {status: 'ok', id : self.id, result: result});
            }
          });
        }
      });
  }
};

module.exports = SensorTagAcc;
