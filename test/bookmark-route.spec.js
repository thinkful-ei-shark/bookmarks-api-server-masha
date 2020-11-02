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

  describe('GET /api/bookmarks', () => {
    describe('without authorization', () => {
      it('returns 401', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .expect(401);
      });
    });
    describe('with seeded bookmarks', () => {
      it('returns list of bookmarks', () => {
        return db.into('bookmark').insert(testBookmarks)
          .then(() => {
            return supertest(app)
              .get('/api/bookmarks')
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
          .get('/api/bookmarks')
          .set({ authorization })
          .expect(200)
          .expect('Content-Type', /json/)
          .then(res => {
            expect(res.body).to.eql([]);
          });
      });
    });
  });
  describe('GET /api/bookmarks/:bm_id', () => {
    describe('with valid request', () => {
      it('returns correct bookmark', () => {
        return db.into('bookmark').insert(testBookmarks)
          .then(() => {
            return supertest(app)
              .get(`/api/bookmarks/${testBookmarks[0].bm_id}`)
              .set({ authorization })
              .expect(200);
          });
      });
    });
    describe('with nonexistent bm_id', () => {
      it('returns 404 not found', () => {
        return supertest(app)
          .get('/api/bookmarks/1')
          .set({ authorization })
          .expect(404);
      });
    });
    describe('with invalid bm_id', () => {
      it('returns 400 bad request', () => {
        return supertest(app)
          .get('/api/bookmarks/foo')
          .set({ authorization })
          .expect(400);
      });
    });
  });
  describe('POST /api/bookmarks', () => {
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
          .post('/api/bookmarks')
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
          .post('/api/bookmarks')
          .send({})
          .set({ authorization })
          .expect(400);
      });
    });
    describe('required fields missing', () => {
      it('returns 400 bad request', () => {
        return supertest(app)
          .post('/api/bookmarks')
          .send({ foo: 'bar' })
          .set({ authorization })
          .expect(400);
      });
    });
    describe('rating not a number', () => {
      it('returns 400 bad request', () => {
        return supertest(app)
          .post('/api/bookmarks')
          .send({ ...testBookmarks[0], bm_rating: 'foo' })
          .set({ authorization })
          .expect(400);
      });
    });
    describe('invalid URL', () => {
      it('returns 400 bad request', () => {
        return supertest(app)
          .post('/api/bookmarks')
          .send({ ...testBookmarks[0], bm_url: 'bar' })
          .set({ authorization })
          .expect(400);
      })
    })
  });
  describe('PATCH /api/bookmarks/:bm_id', () => {
    describe('with valid id and fields', () => {
      it('updates db and returns 204', () => {
        const bm_id = 1;
        const updatedFields = { bm_rating: 5 };
        return db('bookmark')
          .insert(testBookmarks)
          .then(() => {
            return supertest(app)
              .patch(`/api/bookmarks/${bm_id}`)
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
    describe('with no such id', () => {
      it('returns 404 not found', () => {
        const bm_id = 1;
        const updatedFields = { bm_description: 'foo' };
        return supertest(app)
          .patch(`/api/bookmarks/${bm_id}`)
          .send(updatedFields)
          .set({ authorization })
          .expect(404);
      })
    })
    describe('with id not supplied', () => {
      it('returns 404 not found', () => {
        return supertest(app)
          .patch('/api/bookmarks')
          .set({ authorization })
          .expect(404);
      })
    })
    describe('with invalid id', () => {
      it('returns 400 bad request', () => {
        return supertest(app)
        .patch('/api/bookmarks/foo')
        .set({ authorization })
        .send({bm_rating: 1})
        .expect(400);
      })
    })
    describe('with valid id but invalid fields', () => {
      it('returns 400 bad request', () => {
        return db('bookmark')
          .insert(testBookmarks)
          .then(() => {
            const bm_id = 1;
            const updatedFields = { foo: 'bar' }
            return supertest(app)
              .patch(`/api/bookmarks/${bm_id}`)
              .set({ authorization })
              .send(updatedFields)
              .expect(400);
          });
      });
    });
  });
  describe('DELETE /api/bookmarks/:bm_id', () => {
    describe('valid id', () => {
      it('returns 204 and deletes item from db', () =>
      {
        return db('bookmark')
        .insert(testBookmarks)
        .then(() => {
          bm_id = testBookmarks[0].bm_id;
          return supertest(app)
            .delete(`/api/bookmarks/${bm_id}`)
            .set({ authorization })
            .expect(204)
            .then(() => {
              return db('bookmark')
                .select('*')
                .where('bm_id', bm_id)
                .then(res => {
                  expect(res).to.be.empty;
                })
            })
        });
      });
    })
    describe('no such id', () => {
      it('returns 404', () => {
        const bm_id = 1;
        return supertest(app)
          .delete(`/api/bookmarks/${bm_id}`)
          .set({ authorization })
          .expect(404);
      });
    });
    describe('invalid id', () => {
      it('returns 400 bad request', () => {
        return supertest(app)
        .delete('/api/bookmarks/foo')
        .set({ authorization })
        .expect(400);
      });
    });
    describe('id not provided', () => {
      it('returns 404 not found', () => {
        return supertest(app)
          .delete('/api/bookmarks')
          .set({ authorization })
          .expect(404);
      })
    })
  });
});