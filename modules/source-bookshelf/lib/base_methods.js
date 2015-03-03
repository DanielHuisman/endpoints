const _ = require('lodash');
const bPromise = require('bluebird');

exports.addCreate = function (source) {
  source.model.create = function (params, toManyRels) {
    // this should be in a transaction but we don't have access to it yet
    return this.forge(params).save(null, {method: 'insert'}).tap(function (model) {
      return bPromise.map(toManyRels, function(rel) {
        return model.related(rel.name).attach(rel.ids);
      });
    }).then(function(model) {
      return this.forge({id:model.id}).fetch();
    }.bind(this));
  };
};

exports.addUpdate = function (source) {
  // this should be in a transaction but we don't have access to it yet
  source.model.prototype.update = function (params, toManyRels, previous) {
    const clientState = _.extend(previous, params);
    return this.save(params, {patch: true, method: 'update'}).tap(function (model) {
      console.log(model.toJSON());
      return bPromise.map(toManyRels, function(rel) {
        return model.related(rel.name).detach().then(function() {
          return model.related(rel.name).attach(rel.ids);
        });
      });
    }).then(function(model) {

      // Bookshelf .previousAttributes() doesn't work
      // See: https://github.com/tgriesser/bookshelf/issues/326#issuecomment-76637186
      if (_.isEqual(model.toJSON(), clientState)) {
        return null;
      }
      return model;
    });
  };
};
