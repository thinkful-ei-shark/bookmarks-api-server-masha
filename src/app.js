const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');

const errorHandler = require('./errorhandler');
const validateBearerToken = require('./validate-bearer-token');
const bookmarkRoute = require('./bookmark-route');

const { NODE_ENV } = require('./config');

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';


const app = express();

app.use(morgan(morganOption));
app.use(validateBearerToken);
app.use(helmet());
app.use(cors());

app.use('/bookmarks', bookmarkRoute);

app.use(errorHandler);

module.exports = app;