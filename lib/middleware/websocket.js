'use strict';
var _ = require('lodash');

var KEYS = ['id', 'time', 'value', 'path'];

module.exports = function websocket(url, topic){
  var socket = require('socket.io-client')(url),
      connected = false;

  socket.on('connect', function(){
    connected = true;
    socket.once('disconnect', function(){
      connected = false;
    });
  });
  return function websocket(req, next){
    var data = {};

    _.each(KEYS, function (k) {
      data[k] = req[k];
    });
    if (connected) {
      try { socket.emit(topic, data); } catch (e) { }
    }
    next();
  };
};
