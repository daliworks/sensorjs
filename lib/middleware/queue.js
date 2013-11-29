'use strict';
var _ = require('lodash');
require('underscore-query')(_);

module.exports = function queue(num){
  return function queue(req, next){
    if (req.queue) {
      req.queue = [];
    }
    req.queue.unshift(req.value);
    if (req.queue >= num) {
      req.queue.splice(req.queue.length - 1, 1);
    }
    next();
  };
};
