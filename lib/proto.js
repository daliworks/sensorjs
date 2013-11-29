'use strict';
var app = module.exports = {},
  env = process.env.NODE_ENV || 'development';

app.use = function (fn) {
  if ('function' === typeof fn) {
    this.stack.push(fn);
  }
  return this;
};

app.handle = function (req, out) {
  var stack = app.stack,
  index = 0;

  function next(err) {
    var layer = stack[index++];

    if(!layer) { //done
      return out && out(err);
    }

    try {
      var arity = layer.length;
      if (err && arity === 3) {
        layer(err, req, next);
      } else if (arity < 3) {
        layer(req, next);
      } else {
        next(err);
      }
    } catch (e) {
      next(e);
    }
  }
  next();
};
