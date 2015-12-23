"use strict";

var Sensor = require('../index').Sensor,
        logger = Sensor.getLogger(),
        util = require('util'),
        I2c = require('i2c'),
        events = require('events'),
        _ = require('lodash'),
        async = require('async'),
        os = require('os'),
        I2CBus = require('i2c-bus'),
        isEdison = (os.hostname().indexOf('edison') != -1)? true: false;

var defaultOptions = {
    'debug': false,
    'address': 0x40,
    'device': '/dev/i2c-1',
    'powerMode': 'powerOn',
    'command': 'Trigger_Humidity_Hold_Master'
};

var HTU21D = function(opts) {
    events.EventEmitter.call(this);

    this.options = _.extend({}, defaultOptions, opts);

    if (!isEdison) {
        this.i2c = new I2c(this.options.address, {
            device: this.options.device,
            debug: this.options.debug
        });
    } else {
        this.i2c = I2CBus.openSync(6);
    }

    console.log('self i2c >>> ', this.i2c);
};

util.inherits(HTU21D, events.EventEmitter);

HTU21D.commands = {
    'Trigger_Temperature_Hold_Master': 0xE3,
    'Trigger_Humidity_Hold_Master': 0xE5,
    'Trigger_Temperature_No_Hold_Master': 0xF3,
    'Trigger_Humidity_No_Hold_Master': 0xF5,
    'Write_User_Register': 0xE6,
    'Read_User_Register': 0xE7,
    'Soft_Reset': 0xFE
};

HTU21D.prototype.init = function(callback) {
    var self = this;

    async.series([
        function(done) {
            self.reset('Soft_Reset', done);
        }
    ], function(err, result) {
        var ts = Math.round(+new Date() / 1000);
        var evData = {
            'addr': self.options.address,
            'type': 'HTU21D',
            'ts': ts,
            'result': result,
            'error': err
        };
        if (err) {
            self.emit('sensorInitFailed', evData);
            if (callback) { callback(err, null); }
        } else {
            self.emit('sensorInitCompleted', evData);
            if (callback) { callback(null, true); }
        }
    });
};

HTU21D.prototype.reset = function(command, callback) {
    var self = this;

    console.log('reset >>>');

    async.series([
        function(done) {
            var writeVal;

            writeVal = HTU21D.commands[command];

            if (!isEdison) {
                self.i2c.writeByte(writeVal, function(err) {
                    if (err) {
                        done(new Error('reset error'));
                    } else {
                        done(null);
                    }
                });
            } else {
                var buff = new Buffer(1);

                buff.writeUInt8(writeVal, 0);

                self.i2c.i2cWrite(parseInt(self.options.address), 1, buff, function (err) {
                    if (err) {
                        done(new Error('reset error(edison)'));
                    } else {
                        done(null);
                    }
                });
            }
        },
        function(done) {
            setTimeout(function () {
                done(null);
            }, 15);
        }
    ], function(err) {
        var ts = Math.round(+new Date() / 1000);
        var evData = {
            'addr': self.options.address,
            'type': 'HTU21D',
            'setting': 'reset',
            'newValue': command,
            'ts': ts,
            'error': err
        };
        if (err) {
            self.emit('sensorSettingFailed', evData);
            if (callback) { callback(err); }
        } else {
            self.emit('sensorSettingChanged', evData);
            if (callback) { callback(null, command); }
        }
    });
};

HTU21D.prototype.begin = function(command, callback) {
    var self = this;

    async.series([
        function(done) {
            var writeVal;

            writeVal = HTU21D.commands[command];

            if (!isEdison) {
                self.i2c.writeByte(writeVal, function(err) {
                    if (err) {
                        done(new Error('begin error'));
                    } else {
                        done(null);
                    }
                });
            } else {
                var buff = new Buffer(1);

                buff.writeUInt8(writeVal, 0);

                self.i2c.i2cWrite(parseInt(self.options.address), 1, buff, function (err) {
                    if (err) {
                        done(new Error('begin error(edison)'));
                    } else {
                        done(null);
                    }
                });
            }
        },
        function(done) {
            if (!isEdison) {
                self.i2c.readByte(function(err, res) {
                    if (err) {
                        done(new Error('begin error'));
                    } else {
                        // after reset should be 0x2
                        logger.info('[DigitalHumidity/driver/HTU21D] begin success', res);

                        // TODO: check res in the init process and reset again if the res is not 0x2

                        done(null, res);
                    }
                });
            } else {
                var buffer = new Buffer(2);

                self.i2c.i2cRead(parseInt(self.options.address), 2, buffer, function (err, bytesRead, buff) {
                    if (err) {
                        done(new Error('begin error(edison)'));
                    } else {
                        // after reset should be 0x2
                        logger.info('[DigitalHumidity/driver/HTU21D] begin success', res);

                        // TODO: check res in the init process and reset again if the res is not 0x2

                        done(null, res);
                    }
                });
            }
        }
    ], function(err, result) {
        var ts = Math.round(+new Date() / 1000);
        var evData = {
            'addr': self.options.address,
            'type': 'HTU21D',
            'setting': 'begin',
            'newValue': command,
            'ts': ts,
            'error': err
        };
        if (err) {
            self.emit('sensorSettingFailed', evData);
            if (callback) { callback(err); }
        } else {
            self.emit('sensorSettingChanged', evData);
            if (callback) { callback(null, result); }
        }
    });
};

HTU21D.prototype.getHumidity = function(callback) {
    var self = this;

    if (!isEdison) {
        self.i2c.writeByte(0xF5, function(err) {
            if (err) {
                    console.log(err);
                    return err;
            }
            else {
                setTimeout(function() {
                    self.i2c.read(3, function(err, data) {
                            if (err) {
                                    console.log(err);
                                    return err;
                            } else {
                                    if ((data.length === 3) && calc_crc8(data, 3)) {
                                            var rawtemp = ((data[0] << 8) | data[1]) & 0xFFFC;
                                            var temperature = ((rawtemp / 65536.0) * 175.72) - 46.85;
                                            //console.log("Temperature, C:", temperature.toFixed(1));
                                            callback(null, temperature.toFixed(1));
                                    }
                            }
                    });
                }, 50);
            }
        });
    } else {
        var buff = new Buffer(1);

        buff.writeUInt8(0xF5, 0);

        console.log('write start >>>');

        self.i2c.i2cWrite(parseInt(self.options.address), 1, buff, function (err) {
            if (err) {
                return err;
            } else {
                console.log('i2cWrite complete!');
                setTimeout(function () {
                    var buffer = new Buffer(3);

                    self.i2c.i2cRead(parseInt(self.options.address), 3, buffer, function (err, bytesRead, buff) {
                        if (err) {
                            return err;
                        } else {
                            if (data.length === 3 &&
                                calc_crc8(data, 3)) {
                                var rawtemp = ((data[0] << 8) | data[1]) & 0xFFFC;
                                var temperature = ((rawtemp / 65536.0) * 175.72) - 46.85;
                                //console.log("Temperature, C:", temperature.toFixed(1));
                                callback(null, temperature.toFixed(1));
                            } 
                        }
                    });
                });
            }
        });
    }
};

HTU21D.prototype.getPercent = function(callback) {
    var self = this;

    async.series([
        function(done) {
            self.getHumidity(done);
        }
    ], function(err, results) {
        //logger.info(results)
        var ts = Math.round(+new Date() / 1000);
        var evData = {
            'addr': self.options.address,
            'type': 'HTU21D',
            'valType': 'light',
            'ts': ts,
            'error': err
        };

        if (err) {
            self.emit('sensorValueError', evData);
            if (callback) { callback(err, null); }
        } else if (_.isUndefined(results[0]) || _.isNull(results[0]) || results[0] < 0) {
            var e = new Error('invalid value(s) from sensor');
            evData.error = e;
            self.emit('sensorValueError', evData);
            if (callback) { callback(e, null); }
        } else {
            evData.sensVal = results[0];
            self.emit('newSensorValue', evData);
            if (callback) { callback(null, results[0]); }
        }
    });
};

function calc_crc8(buf, len) {
    var dataandcrc;
    // Generator polynomial: x**8 + x**5 + x**4 + 1 = 1001 1000 1
    var poly = 0x98800000;
    var i;

    if (len === null) return -1;
    if (len != 3) return -1;
    if (buf === null) return -1;

    // Justify the data on the MSB side. Note the poly is also
    // justified the same way.
    dataandcrc = (buf[0] << 24) | (buf[1] << 16) | (buf[2] << 8);
    for (i = 0; i < 24; i++) {
            if (dataandcrc & 0x80000000)
                    dataandcrc ^= poly;
            dataandcrc <<= 1;
    }
    return (dataandcrc === 0);
}

module.exports = HTU21D;
