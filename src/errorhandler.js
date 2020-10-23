const logger = require('./logger');

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(error, req, res, next) {
  logger.error(error);

  let response;
  if (process.env.NODE_ENV === 'production') {
    response = { error: { message: 'server error' } };
  } else {
    response = { message: error.message, error };
  }
  res.status(500).json(response);
};