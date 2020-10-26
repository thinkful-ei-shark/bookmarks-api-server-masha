const data = require('./data-store');

function validateUrl(string) {
  return /^(http|https):\/\/[^ "]+(\.)[^ "]+$/.test(string);
}

function findItem(id) {
  return data.find(item => id === item.id);
}

function deleteItem(id) {
  const index = data.findIndex(item => id === item.id);
  if (index === -1) return false;
  data.splice(index, 1);
  return true;
}

module.exports = { data, validateUrl, findItem, deleteItem };