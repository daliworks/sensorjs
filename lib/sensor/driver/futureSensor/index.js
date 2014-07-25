'use strict';
var util = require('util'),
    _ = require('lodash'),
    snmp = require ('net-snmp'),
    Sensor = require('../').Sensor;
    
var logger = Sensor.getLogger();

var SENSOR_OIDS = [
  {
    model: 'futureDi',
    countOid:   '1.3.6.1.4.1.42251.1.3.2.2.1.0',
    IDsOid:     '1.3.6.1.4.1.42251.1.3.2.2.2.1.1',
    valuesOid:  '1.3.6.1.4.1.42251.1.3.2.2.2.1.7',
  },
  {
    model: 'futureDo',
    countOid:   '1.3.6.1.4.1.42251.1.3.3.2.1.0',
    IDsOid:     '1.3.6.1.4.1.42251.1.3.3.2.2.1.1',
    valuesOid:  '1.3.6.1.4.1.42251.1.3.3.2.2.1.6',
  },
  {
    model: 'futureTemp',
    countOid:   '1.3.6.1.4.1.42251.1.3.2.3.1.0',
    IDsOid:     '1.3.6.1.4.1.42251.1.3.2.3.2.1.1',
    valuesOid:  '1.3.6.1.4.1.42251.1.3.2.3.2.1.6',
  },
  {
    model: 'futureHumi',
    countOid:   '1.3.6.1.4.1.42251.1.3.2.4.1.0',
    IDsOid:     '1.3.6.1.4.1.42251.1.3.2.4.2.1.1',
    valuesOid:  '1.3.6.1.4.1.42251.1.3.2.4.2.1.6',
  },
],
SNMP_OPTIONS = {
  version: snmp.Version2 // version 1?
};

function FutureSensor(sensorInfo, options) {
  Sensor.call(this, sensorInfo, options);
  if (sensorInfo.model) {
    this.model = sensorInfo.model;
  } 

  //future = sensorDriver.getNetwork('future');
  logger.debug('FutureSensor', sensorInfo);

  var ip = sensorInfo.device.address;
  this.sensorIdx = Number(this.id.slice(-2)); // FIXME: last 2 disits from id
  this.session = snmp.createSession(ip, 'public', SNMP_OPTIONS); 
  // FIXME: share device handle or close after using(probably with timer)
  this.dataTypes = _.first(FutureSensor.properties.dataTypes[this.model]);
}

FutureSensor.properties = {
  supportedNetworks: ['future'],
  dataTypes: { // use hash for diff types depending on model
    futureTemp: ['temperature'], 
    futureHumi: ['humidity'],
    futureDi: ['onoff']
  },
  onChange: false, // FIXME: app.listen
  discoverable: true,
  recommendedInterval: 10000,
  validCachedValueTimeout: 7000,
  maxInstances: 1,
  models: ['futureTemp', 'futureHumi', 'futureDi'],
};

util.inherits(FutureSensor, Sensor);

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
        logger.debug(varbind.oid + ' = ' + varbind.value);
        result[varbind.oid] = varbind.value;
        return false; 
      }
    });
    return cb && cb(null, _.isEmpty(result) ? undefined : result);
  });
}

FutureSensor.prototype._get = function () {
  var self = this,
  sensor = _.find(SENSOR_OIDS, {model: self.model}),
  oid =  sensor.valuesOid && sensor.valuesOid + '.' + this.sensorIdx;

  getSNMP(this.session, oid, function (err, result) {
    var rtn = { id: self.id};
   
    if (!err && !_.isEmpty(result) && _.has(result, oid)) {
      rtn.status = 'ok';
      rtn.result = {};
      rtn.result[self.dataTypes] = result[oid].toString();
      self.emit('data', rtn);
      logger.debug('data', rtn);
    } else {
      rtn.status = 'error';
      rtn.message = err || 'snmp get error';
      self.emit('data', rtn);
      logger.error('data', rtn);
    }
  });
};

module.exports = FutureSensor;
