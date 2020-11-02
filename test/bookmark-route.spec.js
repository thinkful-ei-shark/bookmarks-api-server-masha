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
              .set({ authorization })
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
          .set({ authorization })
          .expect(200)
          .expect('Content-Type', /json/)
          .then(res => {
            expect(res.body).to.eql([]);
          });
      });
    });
  });
  describe('GET /bookmarks/:bm_id', () => {
    describe('with valid request', () => {
      it('returns correct bookmark', () => {
        return db.into('bookmark').insert(testBookmarks)
          .then(() => {
            return supertest(app)
              .get(`/bookmarks/${testBookmarks[0].bm_id}`)
              .set({ authorization })
              .expect(200);
          });
      });
    });
    describe('with nonexistent bm_id', () => {
      it('returns 404 not found', () => {
        return supertest(app)
          .get('/bookmarks/1')
          .set({ authorization })
          .expect(404);
      });
    });
    describe('with invalid bm_id', () => {
      it('returns 400 bad request', () => {
        return supertest(app)
          .get('/bookmarks/foo')
          .set({ authorization })
          .expect(400);
      });
    });
  });
  describe('POST /bookmarks', () => {
    describe('valid request', () => {
      const { bm_title, bm_url, bm_description, bm_rating } = testBookmarks[0];
      it('inserts into db, returns 201, location header, and bookmark object', () => {
        const newBookmark = {
          bm_title,
          bm_url,
          bm_description,
          bm_rating
        };
        return supertest(app)
          .post('/bookmarks')
          .send(newBookmark)
          .set({ authorization })
          .expect(201)
          .then((res) => {
            const bookmark = res.body;
            expect(bookmark).to.include(newBookmark);
            return db('bookmark')
              .count('*')
              .where({ ...bookmark })
              .first()
              .then(res => {
                expect(parseInt(res.count)).to.eql(1);
              });
          });
      });
    });
    describe('empty object sent', () => {
      it('returns 400 bad request', () => {
        return supertest(app)
          .post('/bookmarks')
          .send({})
          .set({ authorization })
          .expect(400);
      });
    });
    describe('required fields missing', () => {
      it('returns 400 bad request', () => {
        return supertest(app)
          .post('/bookmarks')
          .send({ foo: 'bar' })
          .set({ authorization })
          .expect(400);
      });
    });
    describe('rating not a number', () => {
      it('returns 400 bad request', () => {
        return supertest(app)
          .post('/bookmarks')
          .send({ ...testBookmarks[0], bm_rating: 'foo' })
          .set({ authorization })
          .expect(400);
      });
    });
    describe('invalid URL', () => {
      it('returns 400 bad request', () => {
        return supertest(app)
          .post('/bookmarks')
          .send({ ...testBookmarks[0], bm_url: 'bar' })
          .set({ authorization })
          .expect(400);
      })
    })
  });
  describe('PATCH /bookmarks/:bm_id', () => {
    describe('with valid id and fields', () => {
      it('updates db and returns 204', () => {
        const bm_id = 1;
        const updatedFields = { bm_rating: 5 };
        return db('bookmark')
          .insert(testBookmarks)
          .then(() => {
            return supertest(app)
              .patch(`/bookmarks/${bm_id}`)
              .send(updatedFields)
              .set({ authorization })
              .expect(204)
              .then(() => {
                return db('bookmark')
                  .select('*')
                  .where('bm_id', bm_id)
                  .first()
                  .then(res => {
                    expect(res).to.include(updatedFields)
                  })
              })
          })
      })
    })
    describe('with invalid id', () => {

    })
    describe('with nonexistent id', () => {

    })
    describe('with valid id but invalid fields', () => {

    })
  })
});