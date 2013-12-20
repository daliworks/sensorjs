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
  sensorType: ['humidity'],
  onChange: false, // FIXME: app.listen
  discoverable: true,
  recommendedInterval: 10000,
  validCachedValueTimeout: 7000,
  maxInstances: 1,
  models: ['SensorTagHum'],
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

  //logger.debug('read service', service);
  //logger.debug('read char', dataChar);
  if (dataChar && configChar) {
    logger.debug('enable and data read'); 
    configChar.write(new Buffer([0x01]), false, function () { // FIXME: config onetime
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
  var self = this;
  if (this.deviceHandle) {
    this.readHumData(function (err, data) {
      if (err) {
        self.emit('data', {status: 'error', id : self.id, message: err || 'read error'});
      } else {
        self.emit('data', {status: 'ok', id : self.id, result: {'humidity': data}});
      }
    });
  } else {
    ble.getDevice(this.info.device.address, 
      {driverName: 'SensorTagHum', serviceUUIDs: [SensorTagHum.properties.ble.service]}, 
      function (err, devices) {

        if (!err && !_.isEmpty(devices)) {
          self.deviceHandle = devices[0]; 
          self.readHumData(function (err, data) {
            if (err) {
              self.emit('data', {status: 'error', id : self.id, message: err || 'read error'});
            } else {
              self.emit('data', {status: 'ok', id : self.id, result: {'humidity': data}});
            }
          });
        }
      });
  }
};

module.exports = SensorTagHum;
