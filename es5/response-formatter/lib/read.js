'use strict';

var Kapow = require('kapow');
var error = require('./error');

module.exports = function (formatter, config, data) {
  if ((!data || data.length === 0 && data.singleResult) && data.mode !== 'related') {
    return error(Kapow(404, 'Resource not found.'));
  }

  return {
    code: '200',
    data: formatter(data, {
      singleResult: data.singleResult,
      relations: data.relations,
      mode: data.mode,
      baseType: data.baseType,
      baseId: data.baseId,
      baseRelation: data.baseRelation
    })
  };
};