const BookmarkService = require('../src/bookmark-service');
const knex = require('knex');
const { expect } = require('chai');

describe('Bookmark Service Object', () => {
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

  describe('getAllBookmarks()', () => {
    describe('with seeded bookmarks', () => {
      it('resolves all bookmarks', () => {
        return db.into('bookmark').insert(testBookmarks)
          .then(() => {
            return BookmarkService.getAllBookmarks(db)
              .then(actual => {
                expect(actual).to.eql(testBookmarks);
              });
          });
      });
    });
    describe('without seeded bookmarks', () => {
      it('returns empty array', () => {
        return BookmarkService.getAllBookmarks(db)
          .then(actual =>
            expect(actual).to.eql([]));
      });
    });
  });
  describe('getBookmark()', () => {
    describe('with seeded bookmarks', () => {
      it('returns bookmark with correct id', () => {
        const bm_id = testBookmarks[0].bm_id;
        return db.into('bookmark').insert(testBookmarks)
          .then(() => {
            return BookmarkService.getBookmark(db, bm_id)
              .then(actual => {
                expect(actual.bm_id).to.eql(bm_id);
              });
          });
      });
    });
    describe('with no such bookmark', () => {
      it('rejects promise', () => {
        const bm_id = 1;
        return BookmarkService.getBookmark(db, bm_id)
          .then(
            () => expect.fail('promise resolved'),
            actual => {
              expect(actual).to.eql(404);
            });
      });
    });
  });
  describe('insertBookmark()', () => {
    describe('one bookmark is inserted into db and returned', () => {
      const newBookmark = testBookmarks[0];
      it('the new bookmark is in the database', () => {
        return BookmarkService.insertBookmark(db, newBookmark)
          .then((res) => {
            expect(res).to.eql(newBookmark);
            db('bookmark')
              .select('*')
              .where('bm_title', newBookmark.bm_title)
              .first()
              .then(res => {
                expect(res).to.be.an('Object');
                expect(res.bm_title).to.eql(newBookmark.bm_title);
                expect(res.bm_url).to.eql(newBookmark.bm_url);
                expect(res.bm_description).to.eql(newBookmark.bm_description);
                expect(res.bm_rating).to.eql(newBookmark.bm_rating);
              });
          });
      });
    });
    describe('receiving malformed bookmark', () => {
      it('rejects the promise', () => {
        return BookmarkService.insertBookmark(db, { foo: 'foo' })
          .then(
            () =>
              expect.fail('promise resolved'),
            res => expect(res).to.exist
          );
      });
    });
    describe('no bookmark passed', () => {
      it('rejects the promise', () => {
        return BookmarkService.insertBookmark(db)
          .then(
            () =>
              expect.fail('promise resolved'),
            res =>
              expect(res).to.eql(404)
          );
      });
    });
  });
  describe('deleteBookmark()', () => {
    const bookmarkToDelete = testBookmarks[0];
    describe('if correct id supplied', () => {
      it('bookmark is no longer in database, function returns true', () => {
        return db('bookmark').insert(bookmarkToDelete)
          .then(() => {
            return BookmarkService.deleteBookmark(db, bookmarkToDelete.bm_id)
              .then(() => {
                return db('bookmark').select('*').where('bm_id', bookmarkToDelete.bm_id)
                  .then((res) =>
                    expect(res).to.be.empty);
              });
          });
      });
    });
    describe('if incorrect id supplied', () => {
      it('rejects promise', () => {
        return BookmarkService.deleteBookmark(db, 17)
          .then(
            () => expect.fail('promise resolved'),
            res => expect(res).to.eql(404)
          );
      });
    });
  });
  describe('updateBookmark()', () => {
    describe('valid id and fields', () => {
      it('updated object in database, function returns true', () => {
        return db('bookmark')
          .insert(testBookmarks)
          .then(() => {
            const bm_id = 1;
            const updatedFields = { bm_rating: 5 };
            return BookmarkService.updateBookmark(db, bm_id, updatedFields)
              .then(() => {
                return db('bookmark')
                  .select('*')
                  .where('bm_id', bm_id)
                  .first()
                  .then((res) => {
                    expect(res).to.include(updatedFields);
                  });
              });
          });
      });
    });
    describe('invalid id', () => {
      it('returns 404', () => {
        const bm_id = 1;
        const updatedFields = { bm_description: 'foo ' };
        return BookmarkService.updateBookmark(db, bm_id, updatedFields)
          .then(
            () => expect.fail('promise resolved'),
            err =>
              expect(err).to.eql(404));
      });
    });
  });
});