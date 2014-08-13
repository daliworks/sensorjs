/*jshint camelcase: false*/
'use strict';
var fs = require('fs'),
  path = require('path'),
  util = require('util'),
  _ = require('lodash'),
  EventEmitter = require('events').EventEmitter,
  proto = require('./proto'),
  sensor = require('./sensor');

function createSense() {
  function app(req, next){ app.handle(req, next); }

  util.inherits(app, EventEmitter);

  _.merge(app, proto);
  
  app.stack = [];
  app.cache = {};
  
  for (var i = 0; i < arguments.length; ++i) {
    app.use(arguments[i]);
  }
  
  return app;
}

exports = module.exports = createSense;
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

