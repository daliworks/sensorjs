'use strict';
var _ = require('lodash');
require('underscore-query')(_);

var KEYS = ['id', 'time', 'value', 'path'];

module.exports = function queue(num){
  return function queue(req, next){
    var data = {};
    if (!req.queue) {
      req.queue = [];
    }
    _.each(KEYS, function (k) {
      data[k] = req[k];
    });
    req.queue.unshift(data);
    if (req.queue >= num) {
      req.queue.splice(req.queue.length - 1, 1);
    }
    next();
  };
};
