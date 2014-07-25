'use strict';
var util = require('util'),
    _ = require('lodash'),
    snmp = require ('net-snmp'),
    Actuator = require('../').Actuator;
    
var logger = Actuator.getLogger();

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

function FutureActuator(sensorInfo, options) {
  Actuator.call(this, sensorInfo, options);
  if (sensorInfo.model) {
    this.model = sensorInfo.model;
  } 
  //future = sensorDriver.getNetwork('future');
  logger.debug('FutureActuator', sensorInfo);

  var ip = sensorInfo.device.address;
  this.sensorIdx = Number(this.id.slice(-2)); // FIXME: last 2 disits from id
  this.session = snmp.createSession(ip, 'public', SNMP_OPTIONS); // FIXME: share device handle
  this.dataTypes = _.first(FutureActuator.properties.dataTypes[this.model]);
}

FutureActuator.properties = {
  supportedNetworks: ['future'],
  dataTypes: ['onoff', 'powerSwitch'],
  discoverable: true,
  maxInstances: 5,
  models: ['futureDo'],
  commands: ['on', 'off'],
};

util.inherits(FutureActuator, Actuator);

FutureActuator.prototype.on = function (options, cb) {
  var self = this;
  this.__set(1, function (err) {
    return _.isFunction(cb) && cb(err, self.id + ' is on');
  });
};

FutureActuator.prototype.off = function (options, cb) {
  var self = this;
  this.__set(0, function (err) {
    return _.isFunction(cb) && cb(err, self.id + ' is off');
  });
};

FutureActuator.prototype.__set = function (value, cb) {
  var self = this,
  sensor = _.find(SENSOR_OIDS, {model: self.model}),
  setOid =  sensor.valuesOid && sensor.valuesOid + '.' + this.sensorIdx,
  setVarbind = {
    oid: setOid,
    type: snmp.ObjectType.Integer,
    value: value,
  };

  if (!this.session) {
    logger.error('[futureActuator:_set]snmp session is not ready');
    return cb && cb(new Error('snmp session is not ready'));
  }

  this.session.set([setVarbind], function (err, result) {
    if (!err && !_.isEmpty(result[0]) && result[0][setOid]) {
      logger.info('[futureActuator:_set] set val=', result[0].value);
      return cb && cb();
    } else {
      logger.error('[futureActuator:_set]snmp set failure', err, result);
      return cb && cb(new Error('snmp set failure'));
    }
  });
};

module.exports = FutureActuator;
