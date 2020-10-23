module.exports = function testUrl (string) {
  return /^(http|https):\/\/[^ "]+(\.)[^ "]+$/.test(string);
};