const bookmarkRouter = require('express').Router();
const parseJson = require('express').json();

const BookmarkService = require('./bookmark-service');
const { validateUrl, deleteItem } = require('./data-helpers');
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

// GET /
bookmarkRouter
  .route('/')
  .get((req, res, next) => {
    const db = req.app.get('db');
    return BookmarkService.getAllBookmarks(db)
      .then(data => {
        return res
          .status(200)
          .json(data);
      })
      .catch(next);
  })

  // POST /
  .post(parseJson, validateJsonRequest, (req, res) => {
    const db = res.app.get('db');
    if (Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ message: 'no bookmark object received' });
    }
    const { bm_title, bm_url, bm_description, bm_rating } = req.body;
    if (!bm_title || !bm_url || !bm_rating) {
      return res
        .status(400)
        .json({ message: 'Title, url, and rating are required' });
    }
    if (!validateUrl(bm_url)) {
      return res
        .status(400)
        .json({ message: 'Invalid URL' });
    }
    if (!parseInt(bm_rating)) {
      return res
        .status(400)
        .json({ message: 'Rating must be a number' });
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
    if (!parseInt(bm_id))
      return res
        .status(400)
        .json({ message: 'id must be an integer' });
    return BookmarkService.getBookmark(db, bm_id)
      .then((data) => {
        return res
          .status(200)
          .json(data);
      })
      .catch(err =>
        err === 404
          ? res
            .status(err)
            .json({ message: `bookmark with id ${bm_id} not found` })
          : next(err)
      );
  })
  .patch(parseJson, validateJsonRequest, (req, res, next) => {
    const db = res.app.get('db');
    const { bm_id } = req.params;
    const { bm_title, bm_url, bm_description, bm_rating } = req.body;

    if (!(bm_title || bm_description || bm_url || bm_rating)) {
      return res
        .status(400)
        .json({ message: 'At least one valid field required' });
    }

    if (bm_url && !validateUrl(bm_url)) {
      return res
        .status(400)
        .json({ message: 'URL must be valid' });
    }

    if (bm_rating && !parseInt(bm_rating)) {
      return res
        .status(400)
        .json({ message: 'Rating must be a number' });
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
          ? res
            .status(404)
            .json({ message: `bookmark with id ${bm_id} not found` })
          : next(err));
  })
  // DELETE /:id
  .delete((req, res) => {
    const { id } = req.params;
    if (!deleteItem(id)) {
      logger.error(`Bookmark with id ${id} not found`);
      return res
        .status(404)
        .json({ message: `Bookmark with id ${id} not found` });
    }
    logger.info(`Bookmark with id ${id} deleted`);
    return res
      .status(200)
      .end();
  });

module.exports = bookmarkRouter;