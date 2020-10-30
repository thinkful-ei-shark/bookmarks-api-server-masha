module.exports = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  API_TOKEN: process.env.API_TOKEN,
  DB_URL: process.env.NODE_ENV === 'testing'
    ? process.env.TESR_DB_URL
    : process.env.DB_URL
};