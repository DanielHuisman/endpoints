import {expect} from 'chai';

import Agent from '../../../../../app/agent';
import Fixture from '../../../../../app/fixture';

describe('creatingResources', function() {
  var bookData;

  beforeEach(function() {
    bookData = {
      type: 'books',
      attributes: {
        title: 'The Lost Book of Tolkien',
        date_published: '2015-02-17'
      },
      relationships: {
        author: {data: {type: 'authors', id: '1'}},
        series: {data: {type: 'series', id: '1'}},
        stores: {data: [
          {type: 'stores', id: '1'}
        ]}
      }
    };
    return Fixture.reset();
  });

  it('must respond to a successful request with an object', function() {
    return Agent.request('POST', '/v1/books')
      .send({ data: bookData })
      .promise()
      .then(function(res) {
        expect(res.status).to.be.within(200, 299);
        expect(res.body).to.be.an('object');
      });
  });

  it('must respond to an unsuccessful request with a JSON object containing a collection keyed by "errors" in the top level', function() {
    return Agent.request('POST', '/v1/books')
      .send({})
      .promise()
      .then(function(res) {
        expect(res.status).to.be.within(400, 499); // any error
        expect(res.body).to.be.an('object');
        expect(res.body.errors).to.be.an('array');
      });
  });

  it('must respond to an invalid schema request with a JSON object containing a collection keyed by "errors" in the top level', function() {
    bookData.attributes.title = {
      invalid: 'attribute'
    };
    return Agent.request('POST', '/v1/books')
      .send({
        data: bookData
      })
      .promise()
      .then(function(res) {
        expect(res.status).to.be.within(400, 499); // any error
        expect(res.body).to.be.an('object');
        expect(res.body.errors).to.be.an('array');
      });
  });

  it('must require a content-type header of application/vnd.api+json', function() {
    return Agent.request('POST', '/v1/books')
      .type('application/json')
      .send({ data: bookData })
      .promise()
      .then(function(res) {
        expect(res.status).to.equal(415);
      });
  });

  // TODO: Source/DB test: verify rollback on error
  // it('must not allow partial updates');

  it('must require a single resource object as primary data', function() {
    return Agent.request('POST', '/v1/books')
      .send({ data: [bookData] })
      .promise()
      .then(function(res) {
        expect(res.status).to.equal(400);
      });
  });

  it('must require primary data to have a type member', function() {
    delete bookData.type;
    return Agent.request('POST', '/v1/books')
      .send({ data: bookData })
      .promise()
      .then(function(res) {
        expect(res.status).to.equal(400);
      });
  });

  describe('clientGeneratedIds', function() {
    it('may accept a client-generated ID along with a request to create a resource', function() {
      return Agent.request('POST', '/v1/stores')
        .send({
          data: {
            id: 9999,
            type: 'stores',
            attributes: {
              name: 'user generated id store'
            }
          }
        })
        .promise()
        .then(function(res) {
          expect(res.status).to.equal(201);
        });
    });

    it('must return 403 Forbidden in response to an unsupported request using a client-generated ID', function () {
      bookData.id = 9999;
      return Agent.request('POST', '/v1/books')
        .send({ data: bookData })
        .promise()
        .then(function(res) {
          expect(res.status).to.equal(403);
        });
    });
  });

  describe('responses', function() {

    describe('201Created', function() {
      it('must respond with 201 and include a Location header identifying the location of the new resource', function() {
        return Agent.request('POST', '/v1/books')
          .send({ data: bookData })
          .promise()
          .then(function(res) {
            expect(res.status).to.equal(201);
            var location = res.headers.location;
            var book = res.body.data;
            var expectedLocation = '/v1/books/' + book.id;

            expect(location).to.equal(expectedLocation);
          });
      });

      it('must include a document containing the primary resource created', function() {
        return Agent.request('POST', '/v1/books')
          .send({ data: bookData })
          .promise()
          .then(function(res) {
            var data = res.body.data;
            expect(res.status).to.equal(201);
            expect(data).to.have.property('id');
            expect(data.date_published).to.equal(bookData.date_published);
            expect(data.title).to.equal(bookData.title);
          });
      });

      it('must make the self link and Location header the same', function() {
        return Agent.request('POST', '/v1/books')
          .send({ data: bookData })
          .promise()
          .then(function(res) {
            expect(res.headers.location).to.equal(res.body.data.links.self);
          });
      });

      it('must add all relations', function() {
        return Agent.request('POST', '/v1/books')
          .send({ data: bookData })
          .promise()
          .then(function(res) {
            expect(res.status).to.equal(201);
            var createData = res.body.data;
            expect(createData.id).to.be.a('string');
            return Agent.request('GET', '/v1/books/' + createData.id + '?include=author,series,stores')
              .promise()
              .then(function(res) {
                var readResult = res.body;
                var payloadData = readResult.data;
                var payloadRelationships = payloadData.relationships;
                expect(readResult.included.length).to.equal(3);
                expect(payloadData.attributes.title).to.equal(bookData.attributes.title);
                expect(payloadData.attributes.date_published).to.equal(bookData.attributes.date_published);
                expect(payloadRelationships.author.data.id).to.equal(bookData.relationships.author.data.id);
                expect(payloadRelationships.series.data.id).to.equal(bookData.relationships.series.data.id);
                expect(payloadRelationships.stores.data[0].id).to.equal(bookData.relationships.stores.data[0].id);
              });
          });
      });
    });

    // Endpoints will respond with a 201 on all create requests
    // Tested above.
    // describe('204NoContent', function() {
    //   it('must respond with either 201 or 204 if the request included a client-generated ID');
    // });

    // API decision to not create the route - endpoints will always support creation
    // describe('403Forbidden', function() {
    //   it('should return 403 Forbidden in response to an unsupported creation request');
    // });

    describe.skip('409Conflict', function() {
      it('must return 409 Conflict when processing a request to create a resource with an existing client-generated ID', function() {
        bookData.id = 1;
        return Agent.request('POST', '/v1/books')
          .send({ data: bookData })
          .promise()
          .then(function(res) {
            expect(res.status).to.equal(409);
          });
      });

      it('must return 409 Conflict when processing a request where the type does not match the endpoint', function() {
        bookData.type = 'authors';
        return Agent.request('POST', '/v1/books')
          .send({ data: bookData })
          .promise()
          .then(function(res) {
            expect(res.status).to.equal(409);
          });
      });
    });

    // Not testable as written. Each error handling branch should be
    // unit-tested for proper HTTP semantics.
    // describe('otherResponses', function() {
    //   it('should use other HTTP codes to represent errors');
    //   it('must interpret errors in accordance with HTTP semantics');
    //   it('should return error details');
    // });
  });
});
