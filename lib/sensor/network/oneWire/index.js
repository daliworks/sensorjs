"use strict";

var fs = require('fs');

var discover = function (callback) {
  fs.readFile('/sys/bus/w1/devices/w1_bus_master1/w1_master_slaves', 'utf8', function (err, data) {
    if (err) {
      callback(err);
    } else {
      var parts = data.split("\n");
      parts.pop();
      if (parts.toString() === 'not found.') {
        callback(new Error('There is no sensors'));
      } else {
        callback(null, parts);
      }
    }
  });
};

exports.discover = discover;
