const path = require('path');

const express = require('express');
const routeBuilder = require('express-routebuilder');

const Endpoints = require('../../../../src');

module.exports = new Endpoints.Application({
  Controller: Endpoints.Controller.extend({
    baseUrl: '/v1',
    responder: Endpoints.Responder.express,
    format: Endpoints.Format.jsonapi,
    store: Endpoints.Store.bookshelf,
    validators: [Endpoints.ValidateJsonSchema]
  }),
  searchPaths: [path.join(__dirname, '..', 'modules')],
  routeBuilder: function (routes, prefix) {
    return routeBuilder(express.Router(), routes, prefix);
  }
});
