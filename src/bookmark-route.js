const bookmarkRouter = require('express').Router();
const parseJson = require('express').json();

const xss = require('xss');
const BookmarkService = require('./bookmark-service');
const logger = require('./logger');

function validateJsonRequest(req, res, next) {
  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('json')) {
    return res
      .status(400)
      .json({ message: 'Request must include JSON body' });
  }
  next();
}

function validateUrl(string) {
  return /^(http|https):\/\/[^ "]+(\.)[^ "]+$/.test(string);
}

function serializeBookmark(bookmark) {
  return {
    bm_id: bookmark.bm_id,
    bm_title: xss(bookmark.bm_title),
    bm_url: bookmark.bm_url,
    bm_description: xss(bookmark.bm_description),
    bm_rating: Number(bookmark.bm_rating)
  };
}

function error(res, status, message) {
  const error = {error: {message}};
  logger.error(error);
  return res
    .status(status)
    .json(error);
}

function notFound(bm_id) {
  return `bookmark with id ${bm_id} not found`;
}

// GET /
bookmarkRouter
  .route('/')
  .get((req, res, next) => {
    const db = req.app.get('db');
    return BookmarkService.getAllBookmarks(db)
      .then(data => {
        return res
          .status(200)
          .json(data.map(bm => serializeBookmark(bm)));
      })
      .catch(next);
  })

  // POST /
  .post(parseJson, validateJsonRequest, (req, res) => {
    const db = res.app.get('db');
    if (Object.keys(req.body).length === 0) {
      return error(res, 400, 'no bookmark object received');
    }
    const { bm_title, bm_url, bm_description, bm_rating } = req.body;
    if (!bm_title || !bm_url || !bm_rating) {
      return error(res, 400, 'Title, url, and rating are required' );
    }
    if (!validateUrl(bm_url)) {
      return error(res, 400, 'Invalid URL' );
    }
    if (!parseInt(bm_rating)) {
      return error(res, 400, 'Rating must be a number' );
    }
    const newBookmark = {
      bm_title,
      bm_url,
      bm_description: bm_description || '',
      bm_rating
    };
    BookmarkService.insertBookmark(db, newBookmark)
      .then(data => {
        return res
          .status(201)
          .json(data);
      });
  });
// GET, PATCH /:bm_id
bookmarkRouter
  .route('/:bm_id')
  .get((req, res, next) => {
    const db = req.app.get('db');
    const { bm_id } = req.params;
    if (!Number(bm_id))
      return error(res, 400, 'id must be an integer');
    return BookmarkService.getBookmark(db, bm_id)
      .then((data) => {
        return res
          .status(200)
          .json(serializeBookmark(data));
      })
      .catch(err =>
        err === 404
          ? error(res, 404, notFound(bm_id))
          : next(err)
      );
  })
  .patch(parseJson, validateJsonRequest, (req, res, next) => {
    const db = res.app.get('db');
    const { bm_id } = req.params;
    const { bm_title, bm_url, bm_description, bm_rating } = req.body;

    if (!(bm_title || bm_description || bm_url || bm_rating)) {
      return error(res, 400, 'At least one valid field required');
    }

    if (bm_url && !validateUrl(bm_url)) {
      return error(res, 400, 'URL must be valid');
    }

    if (bm_rating && !Number(bm_rating)) {
      return error(res, 400, 'Rating must be a number');
    }
    const updatedFields = {};

    bm_title && Object.assign(updatedFields, { bm_title });
    bm_url && Object.assign(updatedFields, { bm_url });
    bm_description && Object.assign(updatedFields, { bm_description });
    bm_rating && Object.assign(updatedFields, { bm_rating });

    return BookmarkService.updateBookmark(db, bm_id, updatedFields)
      .then(() => {
        return res
          .status(204)
          .send();
      })
      .catch(err =>
        err === 404
          ? error(res, 404, notFound(bm_id))
          : next(err));
  })
  // DELETE /:id
  .delete((req, res, next) => {
    const { bm_id } = req.params;
    const db = res.app.get('db');
    return BookmarkService.deleteBookmark(db, bm_id)
      .then(() => {
        return res
          .status(204)
          .send();
      })
      .catch(err =>
        err === 404
          ? error(res, 404, notFound(bm_id))
          : next(err)
      );
  });

module.exports = bookmarkRouter;