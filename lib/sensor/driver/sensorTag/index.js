'use strict';
var exec = require('child_process').exec;

(function (/*callback*/) {
	exec([
      __dirname + './src/sensortag.py',
      'BC:6A:29:AC:16:CA'
    ].join(' '), function (err, data) {
      if (err) {
        console.log(err);
      } 
      console.log('result=', data);
    });
})();
