/*jshint camelcase: false*/
'use strict';
var fs = require('fs'),
  path = require('path'),
  _ = require('lodash'),
  EventEmitter = require('events').EventEmitter,
  proto = require('./proto'),
  sensor = require('./sensor');

exports = module.exports = function () {
  function app(req, next){ app.handle(req, next); }
  _.extend(app, proto);
  _.extend(app, EventEmitter.prototype);
  app.stack = [];
  app.cache = {};
  for (var i = 0; i < arguments.length; ++i) {
    app.use(arguments[i]);
  }
  return app;
};

exports.proto = proto;
exports.sensor = sensor;
exports.middleware = {};

/**
 * Auto-load bundled middleware with getters.
 */
fs.readdirSync(__dirname + '/middleware').forEach(function(filename){
  if (!/\.js$/.test(filename)) { return; }
  var name = path.basename(filename, '.js');
  function load(){ return require('./middleware/' + name); }
  exports.middleware.__defineGetter__(name, load);
  exports.__defineGetter__(name, load);
});

