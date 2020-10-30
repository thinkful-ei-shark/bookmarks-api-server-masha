const bookmarkRouter = require('express').Router();
const parseJson = require('express').json();

const BookmarkService = require('./bookmark-service');
const { findItem, validateUrl, deleteItem } = require('./data-helpers');
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
    const { bm_title, bm_url, bm_description, bm_rating } = req.body;
    // if (!title) {
    //   return res
    //     .status(400)
    //     .json({ message: 'Title required' });
    // }
    // if (!url || !validateUrl(url)) {
    //   return res
    //     .status(400)
    //     .json({ message: 'Valid URL required' });
    // }
    // if (!rating) {
    //   return res
    //     .status(400)
    //     .json({ message: 'Rating required' });
    // }
    // if (!parseInt(rating)) {
    //   return res
    //     .status(400)
    //     .json({ message: 'Rating must be a number' });
    // }

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
      .catch(err => {
        return err === 404
          ? res
            .status(err)
            .json({ message: `bookmark with id ${bm_id} not found` })
          : next(err);
      });
  })
  .patch(parseJson, validateJsonRequest, (req, res) => {
    const { id } = req.params;
    const { title, url, desc, rating } = req.body;

    if (!(title || desc || url || rating)) {
      return res
        .status(400)
        .json({ message: 'At least one valid field required' });
    }

    if (url && !validateUrl(url)) {
      return res
        .status(400)
        .json({ message: 'URL must be valid' });
    }

    if (rating && !parseInt(rating)) {
      return res
        .status(400)
        .json({ message: 'Rating must be a number' });
    }

    const bookmark = findItem(id);
    if (!bookmark) {
      logger.error(`Bookmark with id ${id} not found`);
      return res
        .status(404)
        .json({ message: `Bookmark with id ${id} not found` });
    }

    title && Object.assign(bookmark, { title });
    url && Object.assign(bookmark, { url });
    desc && Object.assign(bookmark, { desc });
    rating && Object.assign(bookmark, { rating });

    logger.info(`Bookmark with id ${id} updated`);
    return res
      .status(200)
      .json(bookmark);
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