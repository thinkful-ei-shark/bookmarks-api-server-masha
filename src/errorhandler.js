module.exports = () =>
// eslint-disable-next-line no-unused-vars
  (error, req, res, next) => {
    let response;
    if (process.env.NODE_ENV === 'production') {
      response = { error: { message: 'server error' } };
    } else {
      console.error(error);
      response = { message: error.message, error };
    }
    res.status(500).json(response);
  };