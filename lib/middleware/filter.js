'use strict';
var _ = require('lodash');
require('underscore-query')(_);

module.exports = function filter(options){
  return function filter(req, next){
    if (!_.isEmpty(_.query([req], {value: options}))) {
      next();
    }
  };
};
