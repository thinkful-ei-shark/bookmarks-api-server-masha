const bookmarkRouter = require('express').Router();
const parseJson = require('express').json();
const uuid = require('uuid').v4;

const testUrl = require('./test-url');
const data = require('./data-store');

// GET /
bookmarkRouter
  .route('/')
  .get((req, res) => {
    res
      .status(200)
      .json(data);
  })

  // POST /
  .post(parseJson, (req, res) => {
    const contentType = req.headers['content-type'];
    const { title, url, desc, rating } = req.body;
    if (!contentType || !contentType.includes('json')) {
      return res
        .status(400)
        .json({ message: 'Request must include JSON body' });
    }
    if (!title) {
      return res
        .status(400)
        .json({ message: 'Title required' });
    }
    if (!url || !testUrl(url)) {
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
// DELETE /:id

module.exports = bookmarkRouter;