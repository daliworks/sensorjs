'use strict';
var Sensor = require('../index').Sensor,
    serialport = require('serialport'),
    util = require('util'),
    nmea = require('nmea'),
    logger = Sensor.getLogger();

function latLngToDecimal(coord){
  if (coord === undefined) {
    return ;
  }
  var negative = (parseInt(coord, 10) < 0),
  decimal = null,
  match = coord.match(/^-?([0-9]*?)([0-9]{2,2}\.[0-9]*)$/),
  deg, min;

  if (match) {
    deg = parseInt(match[1], 10);
    min = parseFloat(match[2]);

    decimal = deg + (min / 60);
    if (negative){
      decimal *= -1;
    }
  }

  return decimal.toFixed(5);
}

function Gps(sensorInfo, options) {
  var self = this,
  addr, port;

  Sensor.call(this, sensorInfo, options);
  addr = Number(this.info.device.address, 10);
  
  if (addr) {
    port = new serialport.SerialPort('/dev/ttyO' + addr, {
      baudrate: options.baudRate || 9600,
      parser: serialport.parsers.readline('\r\n')
    });
    port.on('data', function(line) {
      var loc;
      try {
        loc = nmea.parse(line);
      } catch (e) {
        logger.error('nmea parse err', e);
      }
      if (loc && loc.lat && loc.lon) {
        self.lastLoc = {
          status: 'ok',
          id: self.id,
          result: {
            'location': {
              lat: latLngToDecimal(loc.lat), 
              lng: latLngToDecimal(loc.lon)
            }
          }
        };
        logger.debug('lastLoc', self.lastLoc);
        if (self.onChange) {
          self.emit('change', self.lastLoc);
        }
      }
    });
  }
}

Gps.properties = {
  supportedNetworks: ['uart'],
  dataTypes: ['location'],
  onChange: false,
  discoverable: false,
  addressable: true,
  recommendedInterval: 60000,
  maxInstances: 1,
  model: 'gps',
  idTemplate: '{model}-{gatewayId}',
  maxRetries: 8,
  address: 0,
  category: 'sensor'
};

util.inherits(Gps, Sensor);

/*
 * Get sensor data
 * @param sensor : The sensor ID
 * @param callback : callback (err, {id, value})
*/
Gps.prototype._get = function () {
  var self = this;
  if (this.lastLoc) { //FIXME: check if too old one
    this.emit('data', this.lastLoc);
  } else {
    this.emit('data', {status: 'error', id : self.id, message: 'gps data is not available'});
  }
  return;
};

Gps.prototype._enableChange = function () {
  this.onChange = true;  
};

module.exports = Gps;
