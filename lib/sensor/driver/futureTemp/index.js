'use strict';

var util = require('util'),
    _ = require('lodash'),
    snmp = require ('net-snmp'),
    sensorDriver = require('../../'),
    Sensor = require('../').Sensor;
    
var logger = Sensor.getLogger(),
  future, sensorIdx, session;

var TARGET_IP = '192.168.1.202', //FIXME: get this from mac addr
//MAC_OID = '1.3.6.1.4.1.42251.1.3.2.2.1.2', // mac address
//SENSOR_NUM_OID = '.1.3.6.1.4.1.42251.1.1.4.1.1.0',
//SENSOR_TYPE_OID = '.1.3.6.1.4.1.42251.1.1.4.1.2.1.3',
SENSOR_VALUE_OID = '.1.3.6.1.4.1.42251.1.1.4.1.2.1.6',
SNMP_OPTIONS = {
  port: 161,
  retries: 1,
  timeout: 5000, // timeout 5 secs
  transport: 'udp4',
  trapPort: 162,
  version: snmp.Version2 // version 1?
};

function FutureTemp(sensorInfo, options) {
  Sensor.call(this, sensorInfo, options);
  if (sensorInfo.model) {
    this.model = sensorInfo.model;
  } 
  future = sensorDriver.getNetwork('future');
  logger.error('FutureTemp', sensorInfo);

  var ip = TARGET_IP; //FIXME: get ip from mac
  sensorIdx = 1; // FIXME: get idx from sensorInfo.id(mac + type)?
  session = snmp.createSession(ip, 'public', SNMP_OPTIONS); // FIXME: share device handle
}

FutureTemp.properties = {
  supportedNetworks: ['future'],
  sensorType: ['temperature'],
  onChange: false, // FIXME: app.listen
  discoverable: true,
  recommendedInterval: 10000,
  validCachedValueTimeout: 7000,
  maxInstances: 1,
  models: ['futureTemp'],
};

util.inherits(FutureTemp, Sensor);


function getSNMP(session, oids, cb) {
  var result = {};
  if (!_.isArray(oids)) {
    oids = [oids];
  }
  session.get(oids, function (err, varbinds) {
    if (err) {
      logger.error ('get oids=%j err=', oids, err);
      return cb && cb(err);
    }
    _.each(varbinds, function (varbind) {
      if (snmp.isVarbindError(varbind)) {
        logger.error('varbind error', snmp.varbindError(varbind));
      } else{
        logger.info(varbind.oid + ' = ' + varbind.value);
        result[varbind.oid] = varbind.value;
        return false; 
      }
    });
    return cb && cb(null, _.isEmpty(result) ? undefined : result);
  });
}

FutureTemp.prototype._get = function () {
  var oid = SENSOR_VALUE_OID + '.' + sensorIdx,
  self = this;

  getSNMP(session, oid, function (err, result) {
    if (!err && !_.isEmpty(result) && result[oid]) {
      self.emit('data', {status: 'ok', id: self.id, result: result[oid]});
    } else {
      self.emit('data', {status: 'error', id : self.id, message: err || 'snmp get error'});
    }
  });
};

module.exports = FutureTemp;
