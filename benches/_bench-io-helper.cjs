module.exports = function (filePath) {
  var fs = require('fs');
  return fs.readFileSync(filePath).length;
};
