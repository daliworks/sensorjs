'use strict';

var util = require('util'),
  Network = require('../index'),
  snmp = require ('net-snmp'),
  async = require ('async'),
  logger = Network.getLogger(),
  dgram = require('dgram'),
  _ = require ('lodash'),
  exec = require('child_process').exec,
  Device = require('../../driver/index').Device;

var 
SNMP_TRAP_PORT = 162,
SCAN_PORT = 1234,
SCAN_TIMEOUT = 5000,
MAC_OID = '1.3.6.1.4.1.42251.1.2.2.0', // mac address,FIXME: ip addr for now
IPADDR_OID = '1.3.6.1.4.1.42251.1.2.3.0', // ip address,FIXME: ip addr for now
SENSOR_OIDS = [
  {
    model: 'futureDi',
    driver: 'futureSensor',
    countOid:   '1.3.6.1.4.1.42251.1.3.2.2.1.0',
    IDsOid:     '1.3.6.1.4.1.42251.1.3.2.2.2.1.1',
    valuesOid:  '1.3.6.1.4.1.42251.1.3.2.2.2.1.7',
  },
  {
    model: 'futureDo',
    driver: 'futureActuator',
    countOid:   '1.3.6.1.4.1.42251.1.3.3.2.1.0',
    IDsOid:     '1.3.6.1.4.1.42251.1.3.3.2.2.1.1',
    valuesOid:  '1.3.6.1.4.1.42251.1.3.3.2.2.1.6',
  },
  {
    model: 'futureTemp',
    driver: 'futureSensor',
    countOid:   '1.3.6.1.4.1.42251.1.3.2.3.1.0',
    IDsOid:     '1.3.6.1.4.1.42251.1.3.2.3.2.1.1',
    valuesOid:  '1.3.6.1.4.1.42251.1.3.2.3.2.1.6',
  },
  {
    model: 'futureHumi',
    driver: 'futureSensor',
    countOid:   '1.3.6.1.4.1.42251.1.3.2.4.1.0',
    IDsOid:     '1.3.6.1.4.1.42251.1.3.2.4.2.1.1',
    valuesOid:  '1.3.6.1.4.1.42251.1.3.2.4.2.1.6',
  },
],
SNMP_OPTIONS = {
  version: snmp.Version2 // version 1?
};


var bcastAddrs;

//get bcast addresse of each ntework interface.
function getAllBroadCast(cb) {
/*jshint bitwise: false*/
  exec('ifconfig', function (err, ifconfig) {
    var ifs = {},
      bcastArr;
    _.each(ifconfig.split('\n\n'), function (netIf) {
      var rtn = /^(\S+)[\S\s]+HWaddr\s(\S+)[\S\s]+inet\saddr:(\S+)[\S\s]+Mask:(\S+)/.exec(netIf);
      if (rtn && rtn[1] && rtn[1] !== 'lo') {
        var 
        ifName = rtn[1],
        mac= rtn[2] && rtn[2].replace(/:/g,'').toLowerCase(),
        addr = rtn[3], 
        subnet = rtn[4],
        bcast;

        var addrArr =  addr && addr.split('.').map(function(x) { return Number(x); }),
        subnetArr = subnet && subnet.split('.').map(function(x) { return Number(x); });

        bcast = _.map(addrArr, function (x, idx) {
          return x | (subnetArr[idx] ^ 0xff);
        }).join('.');
        ifs[ifName] = {
          mac:mac,
          addr: addr,
          subnet: subnet,
          bcast: bcast,
        };
      }
    });
    bcastArr = _.pluck(ifs, 'bcast');
    bcastArr = _.isEmpty(bcastArr) ? ['255.255.255.255'] : bcastArr;
    return cb && cb(null, bcastArr);
  });
}

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

function Future(options) {
  Network.call(this, 'future', options);
}

util.inherits(Future, Network);

Future.prototype._getDevice = function(targetIp, driverOrModel, cb) {
  var self = this,
  sensorInfos = [], 
  session = snmp.createSession(targetIp, 'public', SNMP_OPTIONS),
  macAddr;

  async.waterfall([
    function (done) { // get mac id
      getSNMP(session, IPADDR_OID, function (err, result) {
        macAddr = result && result[IPADDR_OID] && result[IPADDR_OID].toString();
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
          if (sensor.driver === driverOrModel || 
            sensor.driver === driverOrModel) {

            sensorInfos.push({
              id: [macAddr, result[oid].toString()].join('-'),
              model: sensor.model,
              device: {
                protocol: self.protocol, //'future'
                address: targetIp,
              }
            });
          }
        });
        logger.info('found sensors', sensorInfos);
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

function scanSensors(cb) {
  var sender = dgram.createSocket('udp4'),
  listener = dgram.createSocket('udp4'),
  hello = new Buffer('Hello?'),
  ips = [],
  timer = setTimeout(function () {
    timer = null;
    sender.close();
    listener.close();
    logger.info('future:scan result=', ips);
    return cb && cb(null, ips);
  }, SCAN_TIMEOUT);

  try {
    listener.bind(SNMP_TRAP_PORT, function() {
      logger.info('[future:scan]bound SNMP_TRAP_PORT');
    });
    sender.bind(function () {
      sender.setBroadcast(true);
    });
    _.each(bcastAddrs, function (addr) {
      sender.send(hello, 0, hello.length, SCAN_PORT, addr);
    });
    listener.on('message', function(msg, rinfo) {
      if (rinfo && rinfo.address) {
        logger.info('[future:scan] found', rinfo.address);
        ips.push(rinfo.address);
      }
      //FIXME: parse SNMP pdu 
      /* { 
        version: 1, community: 'public',
        pdu: { 
          type: 7, reqid: 0, error: 0, errorIndex: 0,
          varbinds: [ {
              oid: '1,3,6,1,2,1,1,3,0', //uptim
              value: 1306833S 
            }, {
              oid: '1,3,6,1,6,3,1,1,4,1,1',
              value: '1,3,6,1,6,3,1,1,5,6' 
            }, {
              oid: '1,3,6,1,4,1,42251,1,100,2,1,0',
              value: 'ffffffffffff00110031001914514d44'  //device id
            }
          ] } }*/
    });
  } catch (e) { 
    logger.error('future:scan err=', e, ips);
    if (timer) { clearTimeout(timer); timer = null; }
    sender.close();
    listener.close();
    return cb && cb(e, ips);
  }
}

Future.prototype.discover = function (driverOrModel, cb) {
  var self = this,
  devices = [];
  
  if (_.isFunction(driverOrModel)) {
    cb = driverOrModel;
    driverOrModel = undefined;
  }

  async.waterfall([
    function (done) {//gather broadcast ips if not available
      if (bcastAddrs) {
        return done();
      }
      getAllBroadCast(function (err, addrs) {
        if (!err) {
          bcastAddrs = addrs;
          logger.info('future network: bcastAddrs', bcastAddrs);
        }
        return done(err);
      });
    },
    function (done) {
      scanSensors(function (err, ips) {//scan ips
        return done(null, ips);
      });
    },
    function (ips, done) {
      async.eachSeries(ips, function (targetIp, subDone) {
        self._getDevice(targetIp, driverOrModel, function (err, device) {
          if (!err && device) { 
            if (cb) {
              devices.push(device); 
            } else {
              self.emit('discovered', device);
            }
          }
          subDone(err);
        });
      }, function (err) {
        done(err);
      });
    },
  ], function (err) {
    if (cb) {
      cb(err, devices);
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
