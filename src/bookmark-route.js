const bookmarkRouter = require('express').Router();
const parseJson = require('express').json();
const uuid = require('uuid').v4;

const { data, findItem, validateUrl, deleteItem } = require('./data-store');
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
  .get((req, res) => {
    res
      .status(200)
      .json(data);
  })

  // POST /
  .post(parseJson, validateJsonRequest, (req, res) => {
    const { title, url, desc, rating } = req.body;
    if (!title) {
      return res
        .status(400)
        .json({ message: 'Title required' });
    }
    if (!url || !validateUrl(url)) {
      return res
        .status(400)
        .json({ message: 'Valid URL required' });
    }
    if (rating && !parseInt(rating)) {
      return res
        .status(400)
        .json({ message: 'Rating must be a number' });
    }

    const newBookmark = {
      id: uuid(),
      title,
      url,
      desc: desc || '',
      rating: parseInt(rating) || null
    };
    data.push(newBookmark);
    return res
      .status(200)
      .json(newBookmark);
  });
// PATCH /:id
bookmarkRouter
  .route('/:id')
  .get((req, res) => {
    const { id } = req.params;
    const bookmark = findItem(id);
    if (!bookmark) {
      logger.error(`Bookmark with id ${id} not found`);
      return res
        .status(404)
        .json(`Bookmark with id ${id} not found`);
    }
    return res
      .status(200)
      .json(bookmark);
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