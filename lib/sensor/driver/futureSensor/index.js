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
},
DI_POLLING_INTERVAL = 10000, // 10secs
REPORT_INTERVAL = 5 * 60000; // 5min


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
  this.dataTypes = _.first(FutureSensor.properties.dataTypes[this.model]);
  this._cached = {onoff: 0, onoffTime: -1, retries: 0};
}

FutureSensor.properties = {
  supportedNetworks: ['future'],
  dataTypes: { // use hash for diff types depending on model
    futureTemp: ['temperature'], 
    futureHumi: ['humidity'],
    futureDi: ['onoff']
  },
  onChange: {
    futureTemp: false,
    futureHumi: false,
    futureDi: true,
  },
  discoverable: true,
  recommendedInterval: {
    futureTemp: 10000,
    futureHumi: 30000,
    futureDi: 10000,
  },
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
      logger.error ('[futureSensor]get oids=%j err=', oids, err);
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

FutureSensor.prototype._get = function (cb) {
  var self = this,
  sensor = _.find(SENSOR_OIDS, {model: self.model}),
  oid =  sensor.valuesOid && sensor.valuesOid + '.' + this.sensorIdx;

  getSNMP(this.session, oid, function (err, result) {
    var rtn = { id: self.id};
   
    if (!err && !_.isEmpty(result) && _.has(result, oid)) {
      rtn.status = 'ok';
      rtn.result = {};
      rtn.result[self.dataTypes] = result[oid].toString();
      logger.debug('data', rtn);
      if (cb) {
        return cb(null, rtn);
      } else {
        self.emit('data', rtn);
        return;
      }
    } else {
      rtn.status = 'error';
      rtn.message = (err && err.toString()) || 'snmp get error';
      logger.error('data', rtn);
      if (cb) {
        return cb(rtn.message, rtn);
      } else {
        self.emit('data', rtn);
        return;
      }
    }
  });
};


FutureSensor.prototype.checkDi = function(err, di) {
  var self = this,
    now = Date.now();

  if (err) {
    logger.error('change err', di);
    self.emit('change', di);
  } else if (this._cached.onoff !== (di.result && !_.isUndefined(di.result.onoff)) || 
    (this._cached.onoffTime + REPORT_INTERVAL <= now)) {
    logger.debug('di change', di);
    self.emit('change', di);
    this._cached.onoff = di.result.onoff;
    this._cached.onoffTime = now;
  }
};

FutureSensor.prototype._enableChange = function () {
  var self = this;

  if (!this.timer) {
    self._get(self.checkDi.bind(self));
    this.timer = setInterval(function () {
      self._get(self.checkDi.bind(self));
    }, DI_POLLING_INTERVAL);
  }
};

FutureSensor.prototype._clear = function () {
  if (this.session) {
    this.session.close();
    delete this.session;
  }
  if (this.timer) {
    clearInterval(this.timer);
    delete this.timer;
  }
};

module.exports = FutureSensor;
