require('dotenv').config();

const { NODE_ENV, PORT } = require('./config');
const app = require('./app');

app.listen(PORT, () => console.log(`Server started in ${NODE_ENV} mode on ${PORT}...`));