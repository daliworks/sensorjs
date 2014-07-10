'use strict';

var util = require('util'),
    _ = require('lodash');
var sensorDriver = require('../../'),
    Sensor = require('../').Sensor;
    
var logger = Sensor.getLogger();

var ble;
function SensorTagHum(sensorInfo, options) {
  Sensor.call(this, sensorInfo, options);
  if (sensorInfo.model) {
    this.model = sensorInfo.model;
  } 
  ble = sensorDriver.getNetwork('ble');
  console.error('SensorTagHum', sensorInfo);
}

SensorTagHum.properties = {
  supportedNetworks: ['ble'],
  dataTypes: ['humidity'],
  onChange: false, // FIXME: app.listen
  discoverable: true,
  recommendedInterval: 10000,
  validCachedValueTimeout: 7000,
  maxInstances: 1,
  models: ['sensorTagHum'],
  ble: {
    service: 'f000aa2004514000b000000000000000',
    config: 'f000aa2204514000b000000000000000',
    data: 'f000aa2104514000b000000000000000',
  },
  id: '{model}-{macAddress}', // id generation template
};

util.inherits(SensorTagHum, Sensor);

SensorTagHum.prototype.readHumData = function(cb) {
  var service, dataChar, configChar;
  service = this.deviceHandle && this.deviceHandle.services && 
        _.find(this.deviceHandle.services, {uuid: SensorTagHum.properties.ble.service});
  if (service && service.characteristics) {
    dataChar = _.find(service.characteristics, {uuid: SensorTagHum.properties.ble.data});
    configChar = _.find(service.characteristics, {uuid: SensorTagHum.properties.ble.config});
  }

  if (dataChar && configChar) {
    logger.debug('enable data'); 
    // to enable Characteristic
    configChar.write(new Buffer([0x01]), false, function () { // FIXME: config first time only, error handling(timeout)
      logger.debug('data read'); 
      dataChar.read(function (err, data) {
        if (!err && data) {
          var humidity = -6.0 + 125.0 / 65536.0 * (data.readUInt16LE(2) & ~0x0003);
          logger.debug('humidity', humidity);
          return cb && cb(null, humidity);
        } else {
          return cb && cb(err);
        }
      });
    });
  } else {
    return cb && cb (new Error('service or charateristics not found'));
  }
};

SensorTagHum.prototype._get = function () {
  var result = {};
  var self = this;
  if (this.deviceHandle) {
    logger.debug('w/ deviceHandle');
    this.readHumData(function (err, data) {
      if (err) {
        self.emit('data', {status: 'error', id : self.id, message: err || 'read error'});
      } else {
        result[_.first(SensorTagHum.properties.dataTypes)] = data;
        self.emit('data', {status: 'ok', id: self.id, result: result});
      }
    });
  } else {
    logger.debug('getDevice');
    ble.getDevice(this.info.device.address, 
      {driverName: 'SensorTagHum', serviceUUIDs: [SensorTagHum.properties.ble.service]}, 
      function (err, devices) {

        if (!err && !_.isEmpty(devices)) {
          logger.debug('got device');
          if (devices[0].deviceHandle) {
            //property : ex) 'sensorTagHum-bc6a29ac16ca'
            self.deviceHandle = devices[0].deviceHandle[self.model + '-' + self.info.device.address]; 
          } else {
            self.deviceHandle = devices[0]; 
          }
          self.readHumData(function (err, data) {
            if (err) {
              self.emit('data', {status: 'error', id : self.id, message: err || 'read error'});
            } else {
              result[_.first(SensorTagHum.properties.dataTypes)] = data;
              self.emit('data', {status: 'ok', id : self.id, result: result});
            }
          });
        }
      });
  }
};

module.exports = SensorTagHum;
