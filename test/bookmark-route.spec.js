const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const app = require('../src/app');
const { API_TOKEN } = require('../src/config');

const authorization = `Bearer ${API_TOKEN}`;

describe('Bookmark Route', () => {
  let db;
  const testBookmarks = [
    {
      bm_id: 1,
      bm_title: 'Google',
      bm_url: 'https://google.com',
      bm_description: 'Search Monster',
      bm_rating: 4
    },
    {
      bm_id: 2,
      bm_title: 'Facebook',
      bm_url: 'https://facebook.com',
      bm_description: 'Social Media Oligopoly',
      bm_rating: 3
    },
    {
      bm_id: 3,
      bm_title: 'Twitter',
      bm_url: 'https://twitter.com',
      bm_description: 'Social Media Oligopoly #2',
      bm_rating: 3
    },
    {
      bm_id: 4,
      bm_title: 'Jews International',
      bm_url: 'https://jews.international',
      bm_description: 'I love my friends',
      bm_rating: 5
    },
  ];
  before('establish db connection', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });
    app.set('db', db);
  });
  before('ensure test db is empty', () => {
    return db('bookmark').truncate();
  });

  after('destroy db connection', () => {
    return db.destroy();
  });

  afterEach('clear db data', () => {
    return db('bookmark').truncate();
  });

  describe('GET /bookmarks', () => {
    describe('without authorization', () => {
      it('returns 401', () => {
        return supertest(app)
          .get('/bookmarks')
          .expect(401);
      });
    });
    describe('with seeded bookmarks', () => {
      it('returns list of bookmarks', () => {
        return db.into('bookmark').insert(testBookmarks)
          .then(() => {
            return supertest(app)
              .get('/bookmarks')
              .set({authorization})
              .expect(200)
              .expect('Content-Type', /json/)
              .then(res => {
                expect(res.body).to.eql(testBookmarks);
              });
          });
      });
    });
    describe('with no bookmarks', () => {
      it('returns empty list', () => {
        return supertest(app)
          .get('/bookmarks')
          .set({authorization})
          .expect(200)
          .expect('Content-Type', /json/)
          .then(res => {
            expect(res.body).to.eql([]);
          });
      });
    });
  });
});