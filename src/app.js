const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./errorhandler');
const { NODE_ENV } = require('./config');

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';


const app = express();

app.use(morgan(morganOption));
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(errorHandler());

app.get('/', (req, res) => {
  res
    .status(200)
    .json({ message: 'Hello, World!' });
});

module.exports = app;