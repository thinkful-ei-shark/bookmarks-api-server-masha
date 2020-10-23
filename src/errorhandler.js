const logger = require('./logger');

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(error, req, res, next) {
  logger.error(error.stack);

  let response;
  if (process.env.NODE_ENV === 'production') {
    response = { error: { message: 'server error' } };
  } else {
    response = { message: error.message, error: error.stack };
  }
  res.status(500).json(response);
};