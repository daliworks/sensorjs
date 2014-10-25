'use strict';
var _ = require('lodash'),
    logger = require('log4js').getLogger('Middleware');

var KEYS = ['id', 'type', 'time', 'value', 'path', 'status', 'message'];

module.exports = function websocketServer(appServer, topic){
  var io;

  if (appServer) {
    io = require('socket.io')(appServer);

    io.on('connection', function(socket){
      logger.info('[WebsocketServer] socket is connected', socket.id);

      socket.once('disconnect', function(){
        logger.info('[WebsocketServer] socket is disconnected', socket.id);
      });
    });
  }

  return function websocketServer(req, next){
    var data = {};

    if (io) {
      _.each(KEYS, function (k) {
        data[k] = req[k];
      });

      try {
        logger.debug('[WebsocketServer] emitting data', data);
        io.emit(topic || 'data', data);
      } catch (e) {
        logger.error('[WebsocketServer] error on emitting', e);
      }
    }

    next();
  };
};
