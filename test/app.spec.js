const supertest = require('supertest');

const app = require('../src/app');

describe('App', () => {
  describe('GET /', () => {
    it('responds with 200 containing "Hello World"', () => {
      return supertest(app)
        .get('/')
        .expect(200, { message: 'Hello, World!'});
    });
  });
});