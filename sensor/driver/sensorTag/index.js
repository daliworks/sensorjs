"use strict";
var child_process = require('child_process');

(function (callback) {
	child_process.exec([
      __dirname + './src/sensortag.py',
      'BC:6A:29:AC:16:CA'
    ].join(' '), function (err, data) {
      if (err) {
        console.log(err);
      } 
      console.log("result=", data);
    });
  })();
