'use strict';
var _ = require('lodash');

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
    if (req.average.queue.length > 0 && req.average.start < (now - duration*1000)) {
      //FIXME: ignore too old data?
      v = req.value;

      req.value = _.reduce(req.average.queue, function(sum, n){return sum + n;}) / 
              req.average.queue.length;
      req.average.start = now;
      req.average.queue = [];
      return next();
    }
    req.average.queue.push(req.value);
    return;
  };
};
