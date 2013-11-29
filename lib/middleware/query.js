'use strict';
var _ = require('lodash');
require('underscore-query')(_);

module.exports = function query(options){
  return function query(req, next){
    if (!_.isEmpty(_.query(req.value, options))) {
      next();
    }
  };
};
