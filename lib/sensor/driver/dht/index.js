'use strict';
var Sensor = require('../index').Sensor,
  util = require('util'),
  childProcess = require('child_process');

var _cached = { retries: 0},
  inProgress = false,
  logger = Sensor.getLogger();

// options.model : dht11(default) or dht22
function Dht(sensorInfo, options) {
  Sensor.call(this, sensorInfo, options);
  if (sensorInfo.device.address) {
    this.address = sensorInfo.device.address;
  }
  if (sensorInfo.model) {
    this.model = sensorInfo.model;
  } else {
    this.model = (options && options.model === 'dht22') ? 'dht22' : 'dht11';
  }
}

Dht.properties = {
  supportedNetworks: ['gpio'],
  dataTypes: ['humidity'],
  onChange: false,
  discoverable: false,
  addressable: true,
  recommendedInterval: 60000,
  validCachedValueTimeout: 25000,
  maxInstances: 1,
  models: ['dht11', 'dht22'],
  idTemplate: '{model}-{gatewayId}-{deviceAddress}', // id generation template
  errorRange: '1', 
  validValueRange: [0, 100],
  maxRetries: 4,
  category: 'sensor'
};


util.inherits(Dht, Sensor);

Dht.prototype._get = function () {
  var self = this;
  setTimeout(self.__get(), 3000); // delay 1sec to avoid busy situation
};

Dht.prototype.__get = function () {
  var self = this;

  //if (_cached.time && _cached.time + Dht.properties.validCachedValueTimeout > Date.now()) {
  //  _cached.data.time = _cached.time;
  //  self.emit('data', _cached.data);
  //}
  if (inProgress) {
    return;
  }
  inProgress = true;
  childProcess.exec([
    __dirname + '/bin/Beagle_GPIO_dht22',
    '-s', 
    self.model,
    '-g', 
    self.address || '27',
  ].join(' '), {
    timeout: Dht.properties.recommendedInterval,
    killSignal: 'SIGKILL'
  }, function (err, data) {

    var retry = false, 
        rtn;

    inProgress = false;
    if (err) {
      rtn = {status: 'error', id : self.id, message: err.toString()};
      _cached.retries = 0;
      self.emit('data', rtn);
    } else {
      rtn = JSON.parse(data);
    }

    rtn.id = self.id;
    if (rtn.status === 'ok') {
      var now = Date.now();
      if (!_cached.time) { // 1st time init
        _cached.retries = 0;
        retry = true;
      } else {
        var cacheExpire = _cached.time + Dht.properties.validCachedValueTimeout * Dht.properties.maxRetries,
        diff = Math.abs(rtn.result.humidity - _cached.data.result.humidity);

        // retry if cached value is too old or outof accepted error range
        if ((now > cacheExpire) || (diff > Dht.properties.errorRange)) {
          retry = true;
        }
      }
      _cached.time = now;
      _cached.data = rtn;
    } else { // rtn.satus === error
      retry = true;
    }

    if (retry) {
      logger.debug(self.model, 'retry _cached=', _cached, 'due to result=', rtn);
      if (_cached.retries > Dht.properties.maxRetries) {
        rtn = {status: 'error', id : self.id,
          message: 'too many retries due to invalid sensing value value'};
      } else {
        _cached.retries++;
        process.nextTick(function () {self.__get(); });
        return;
      }
    } 

    _cached.retries = 0;
    if (rtn.result) { //keep only humidity, remove temperature
      delete rtn.result.temperature;
    }
    self.emit('data', rtn);
  });
};

module.exports = Dht;
