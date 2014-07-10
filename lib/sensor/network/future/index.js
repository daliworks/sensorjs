'use strict';

var util = require('util'),
  Network = require('../index'),
  snmp = require ('net-snmp'),
  async = require ('async'),
  logger = Network.getLogger(),
  _ = require ('lodash'),
  Device = require('../../driver/index').Device;

var TARGET_IPS = ['192.168.1.202'],
MAC_OID = '1.3.6.1.4.1.42251.1.2.2.0', // mac address,FIXME: ip addr for now
SENSOR_OIDS = [
  {
    model: 'futureDi',
    countOid:   '1.3.6.1.4.1.42251.1.3.2.1.0',
    IDsOid:     '1.3.6.1.4.1.42251.1.3.2.2.1.1',
    valuesOid:  '1.3.6.1.4.1.42251.1.3.2.2.1.6',
  },
  {
    model: 'futureTemp',
    countOid:   '1.3.6.1.4.1.42251.1.3.3.1.0',
    IDsOid:     '1.3.6.1.4.1.42251.1.3.3.2.1.1',
    valuesOid:  '1.3.6.1.4.1.42251.1.3.3.2.1.6',
  },
  {
    model: 'futureHumi',
    countOid:   '1.3.6.1.4.1.42251.1.3.4.1.0',
    IDsOid:     '1.3.6.1.4.1.42251.1.3.4.2.1.1',
    valuesOid:  '1.3.6.1.4.1.42251.1.3.4.2.1.6',
  },
],
SNMP_OPTIONS = {
  port: 161,
  retries: 1,
  timeout: 5000, // timeout 5 secs
  transport: 'udp4',
  trapPort: 162,
  version: snmp.Version2 // version 1?
};

function Future(options) {
  Network.call(this, 'future', options);
}

util.inherits(Future, Network);

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
      }
    });
    return cb && cb(null, _.isEmpty(result) ? undefined : result);
  });
}

Future.prototype._getDevice = function(targetIp, cb) {
  var self = this,
  sensorInfos = [], 
  session = snmp.createSession(targetIp, 'public', SNMP_OPTIONS),
  macAddr;

  async.waterfall([
    function (done) { // get mac id
      getSNMP(session, MAC_OID, function (err, result) {
        macAddr = result && result[MAC_OID] && result[MAC_OID].toString();
        if (!err && !macAddr) {
          err = new Error('mac id not found');
        }
        return done(err);
      });
    },
    function (done) { // get sensors #
      var countOids = _.pluck(SENSOR_OIDS, 'countOid'),
      ids = [], i;
      getSNMP(session, countOids, function (err, result) {
        if (err) { return done(err); }
        _.each(result && SENSOR_OIDS, function (sensor) {
          var count = result[sensor.countOid];
          for(i=0; i < count; i++) {
            ids.push(sensor.IDsOid + '.' + (i+1));
          }
        });
        return done(null, ids);
      });
    },
    function (ids, done) { // get sensor types
      getSNMP(session, ids, function (err, result) {
        _.each(result, function (serial, oid) {
          var sensor = _.find(SENSOR_OIDS, {
            IDsOid: oid.substring(0, oid.lastIndexOf('.'))
          });
          sensorInfos.push({
            id: [macAddr, result[oid].toString()].join('-'),
            model: sensor.model,
            //deviceHandle: {ip: targetIp, oid: oid, type: type} 
          });
        });
        logger.info('found sensors', sensorInfos);
        if (!err && _.isEmpty(sensorInfos)) {
          err = new Error('no sensor infos');
        }
        return done(err);
      });
    }
  ], function (err) {
    //session.close(); //FIXME
    if (!err) {
      return cb && cb(err, new Device(self, macAddr, sensorInfos));
    }
    return cb && cb();
  });
};
Future.prototype.discover = function (driverName, cb) {
  var self = this,
  devices = [];
  
  //FIXME: ignore driverName for now.
  if (_.isFunction(driverName)) {
    cb = driverName;
    driverName = undefined;
  }

  async.eachSeries(TARGET_IPS, function (targetIp, done) {
    self._getDevice(targetIp, function (err, device) {
      if (!err && device) { 
        if (cb) {
          devices.push(device); 
        } else {
          self.emit('discovered', device);
        }
      }
      done(err);
    });
  }, function (err) {
    if (cb) {
      return cb(err, devices);
    } else {
      if (err) {
        self.emit('error', err);
      } else {
        self.emit('done');
      }
    }
  });
};

module.exports = new Future();
