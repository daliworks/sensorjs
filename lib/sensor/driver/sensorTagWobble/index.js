'use strict';

var util = require('util'),
    _ = require('lodash');
var sensorDriver = require('../../'),
    Sensor = require('../').Sensor;
    
var logger = Sensor.getLogger();

var ble;
function SensorTagWobble(sensorInfo, options) {
  Sensor.call(this, sensorInfo, options);
  if (sensorInfo.model) {
    this.model = sensorInfo.model;
  } 
  ble = sensorDriver.getNetwork('ble');
  console.error('SensorTagWobble', sensorInfo);
}

SensorTagWobble.properties = {
  supportedNetworks: ['ble'],
  sensorType: ['onoff'],
  onChange: false, // FIXME: app.listen
  discoverable: true,
  recommendedInterval: 1000, // 1000 miliseconds 
  validCachedValueTimeout: 7000,
  maxInstances: 1,
  models: ['sensorTagWobble'],
  ble: {
    service:'f000aa1004514000b000000000000000',
    config: 'f000aa1204514000b000000000000000',
    data:   'f000aa1104514000b000000000000000',
    period: 'f000aa1304514000b000000000000000'
  },
  id: '{model}-{macAddress}', // id generation template
};

util.inherits(SensorTagWobble, Sensor);

SensorTagWobble.prototype.readWobbleData = function(cb) {
  var service, dataChar, configChar;
  var self = this;
  service = this.deviceHandle && this.deviceHandle.services && 
        _.find(this.deviceHandle.services, {uuid: SensorTagWobble.properties.ble.service});

  if (service && service.characteristics) {
    dataChar = _.find(service.characteristics, {uuid: SensorTagWobble.properties.ble.data});
    configChar = _.find(service.characteristics, {uuid: SensorTagWobble.properties.ble.config});
  }

  if (dataChar && configChar) {
    logger.debug('enable data'); 
    // to enable Characteristic
    configChar.write(new Buffer([0x01]), false, function () { // FIXME: config first time only, error handling(timeout)
      logger.debug('data read'); 
      dataChar.read(function (err, data) {
        if (!err && data) {
          var pre = self.preValue;
          var x = data.readInt8(0) * 4.0 / 256.0;
          var y = data.readInt8(1) * 4.0 / 256.0;
          var z = data.readInt8(2) * 4.0 / 256.0;
          var isWobble = 0;
          if (pre) {
            isWobble = (Math.abs(pre.x - x) + Math.abs(pre.y - y) + Math.abs(pre.z - z)) > 0.2 ? 1 : 0;
          }
          self.preValue = {x: x, y: y, z: z}; 
          logger.debug('isWobble', isWobble);
          return cb && cb(null, isWobble);
        } else {
          return cb && cb(err);
        }
      });
    });
  } else {
    return cb && cb (new Error('service or charateristics not found'));
  }
};

SensorTagWobble.prototype._get = function () {
  var result = {};
  var self = this;
  if (this.deviceHandle) {
    logger.debug('w/ deviceHandle');
    this.readWobbleData(function (err, data) {
      if (err) {
        self.emit('data', {status: 'error', id : self.id, message: err || 'read error'});
      } else {
        result[SensorTagAcc.properties.sensorType] = data;
        self.emit('data', {status: 'ok', id: self.id, result: result});
      }
    });
  } else {
    logger.debug('getDevice');
    ble.getDevice(this.info.device.address, 
      {driverName: 'sensorTagWobble', serviceUUIDs: [SensorTagWobble.properties.ble.service]}, 
      function (err, devices) {

        if (!err && !_.isEmpty(devices)) {
          logger.debug('got device');
          if (devices[0].deviceHandle) {
            //property : ex) 'sensorTagWobble-bc6a29ac16ca'
            self.deviceHandle = devices[0].deviceHandle[self.model + '-' + self.info.device.address]; 
          } else {
            self.deviceHandle = devices[0]; 
          }
          self.readWobbleData(function (err, data) {
            if (err) {
              self.emit('data', {status: 'error', id : self.id, message: err || 'read error'});
            } else {
              result[SensorTagWobble.properties.sensorType] = data;
              self.emit('data', {status: 'ok', id : self.id, result: result});
            }
          });
        }
      });
  }
};

module.exports = SensorTagWobble;
