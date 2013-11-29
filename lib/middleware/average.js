'use strict';
var _ = require('lodash');
require('underscore-query')(_);

//duration in sec
module.exports = function average(duration){ 
  return function average(req, next){
    var now = Date.now(),
      v;
    if (!req.average) {
      req.average = { 
        queue: [],
        start: now,
      };
    }
    if (req.queue.length > 0 && req.average.start < (now - duration*1000)) {
      //FIXME: ignore tool old data?
      v = req.value;

      req.value = _.reduce(req.average.queue, function(sum, n){return sum + n;}) / 
              req.average.queue.length;
      req.average.start = now;
      req.average.queue = [v];
      return next();
    }
    req.average.queue.push(req.value);
  };
};
