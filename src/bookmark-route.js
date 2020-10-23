const bookmarkRouter = require('express').Router();

const data = require('./data-store');

// GET /
bookmarkRouter
  .route('/')
  .get((req, res) => {
    res
      .status(200)
      .json(data);
  });


// POST /
// PATCH /:id
// DELETE /:id

module.exports = bookmarkRouter;