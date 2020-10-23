const data = [{
  id: 'b5582aa8-4f7d-4d66-914b-46ea2e3e6fc3',
  title: 'Google',
  url: 'https://google.com',
  desc: 'Search Monster',
  rating: '4'
}];

function validateUrl (string) {
  return /^(http|https):\/\/[^ "]+(\.)[^ "]+$/.test(string);
}

function findItem (id) {
  return data.find(item => id === item.id);
}

module.exports = { data, validateUrl, findItem};