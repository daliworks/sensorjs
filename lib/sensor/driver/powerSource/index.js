'use strict';
(function (callback) {
  var I2c = require('i2c');

  var I2C_BUS_0 = '/dev/i2c-0', // TPS65217C is on ic2 bus 0
  TPS65217C_I2C_ID = 0x24, // TPS65217C's i2c id
  TPS65217C_STATUS_REG = 0x0a, // TPS65217C's status register address
  AC_FLAG = 0x08,
  USB_FLAG = 0x04;

  var wire = new I2c(TPS65217C_I2C_ID, {device: I2C_BUS_0});

  wire.readBytes(TPS65217C_STATUS_REG, 1, function (err, buf) {
    if (!err && buf.length === 1) {
      return callback(null, {
        status: 'ok',
        result: {
          power: {
            usb: buf[0] & USB_FLAG ? true : false,
            ac: buf[0] & AC_FLAG ? true : false
          }
        }
      });
    } else {
      return callback(new Error('i2c read'), {
        status: 'error',
        message: 'i2c read failure',
      });
    }
  });
})(function (err, result) {
  console.log("err=", err, "result=", result);
});
