'use strict';

var util = require('util'),
  Network = require('../index'),
  snmp = require ('net-snmp'),
  async = require ('async'),
  logger = Network.getLogger(),
  _ = require ('lodash'),
  Device = require('../../driver/index').Device;

var TARGET_IPS = ['192.168.1.202'],
MAC_OID = '1.3.6.1.4.1.42251.1.3.2.2.1.2', // mac address
SENSOR_NUM_OID = '.1.3.6.1.4.1.42251.1.1.4.1.1.0',
SENSOR_TYPE_OID = '.1.3.6.1.4.1.42251.1.1.4.1.2.1.3',
//SENSOR_VALUE_OID = '.1.3.6.1.4.1.42251.1.1.4.1.2.1.6',
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
        logger.info(varbind.oid + ' = ' + varbind.value);
        result[varbind.oid] = varbind.value;
        return false; 
      }
    });
    return cb && cb(null, _.isEmpty(result) ? undefined : result);
  });
}

Future.prototype._getDevice = function(targetIp, cb) {
  var self = this,
  sensorInfos = [],
  session = snmp.createSession(targetIp, 'public', SNMP_OPTIONS),
  macAddr, sensorNum; 

  async.series([
    function (done) { // get mac id
      getSNMP(session, MAC_OID, function (err, result) {
        macAddr = result && result[MAC_OID];
        if (!err && !macAddr) {
          err = new Error('mac id not found');
        }
        return done(err);
      });
    },
    function (done) { // get sensors #
      getSNMP(session, SENSOR_NUM_OID, function (err, result) {
        sensorNum = result && result[SENSOR_NUM_OID];
        if (!err && !sensorNum) {
          err = new Error('sensor Num is zero or not found ');
        }
        return done(err);
      });
    },
    function (done) { // get sensor types
      var typeOids = _.map(_.range(sensorNum), function(idx) {
        return SENSOR_TYPE_OID + '.' + idx;
      });
      getSNMP(session, typeOids, function (err, result) {
        _.each(result, function (type) {
          sensorInfos.push({
            id: macAddr + type,
            driverName: 'futureTemp', 
            //deviceHandle: {ip: targetIp, oid: oid, type: type} 
          });
        });
        if (!err && _.isEmpty(sensorInfos)) {
          err = new Error('no sensor infos');
        }
        return done(err);
      });
    }
  ], function (err) {
    session.close();
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
