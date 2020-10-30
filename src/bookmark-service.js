const BookmarkService = {
  getAllBookmarks(db) {
    return db('bookmark')
      .select('*');
  },
  getBookmark(db, bm_id) {
    return db('bookmark')
      .select('*')
      .where('bm_id', bm_id)
      .first()
      .then(result =>
        result || Promise.reject(`bookmark with id ${bm_id} does not exist`));
  },
  insertBookmark(db, newBookmark) {
    if (!newBookmark) return Promise.reject('cannot insert, no bookmark supplied');
    return db('bookmark')
      .insert(newBookmark)
      .returning('*')
      .then(rows => rows[0])
      .catch(err => Promise.reject(`sql error: ${err.message}`));
  },
  updateBookmark() {
    return Promise.resolve();
  },
  deleteBookmark(db, bm_id) {
    if (!bm_id) return Promise.reject('cannot delete: bm_id required');
    return db('bookmark')
      .where('bm_id', bm_id)
      .delete()
      .then((res) => {
        if (res) return Promise.resolve(true);
        else return Promise.reject(`cannot delete: bookmark with id ${bm_id} not found`);
      });
  }
};

module.exports = BookmarkService;