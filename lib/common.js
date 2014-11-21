var fs = require('fs');

exports.getCurrentVersion = function(directory, collection) {
  return (require(directory + '.versions.json')[collection.toLowerCase()]);
};

/**
 * List all migration files.
 */
exports.list = function(directory, collection) {
  return fs.readdirSync(directory).filter(function(fileName) {
    return fileName.match(new RegExp('^' + collection.toLowerCase()));
  }).sort();
};

/**
 * Provide a hash of files by version.
 */
exports.listByVersion = function(directory, collection) {
  var list = exports.list(directory, collection.toLowerCase());

  return list.reduce(function(prev, value, index) {
    var version = parseInt(value.match(/-(\d{4})-/)[1]);
    prev[version] = value;
    return prev;
  }, {});
}

/**
 * Returns a single migration file
 */
exports.getVersion = function(directory, collection, version) {
  var paddedVersion = String('0000' + version).slice(-4);

  var versions = fs.readdirSync(directory).filter(function(fileName) {
    return fileName.match(new RegExp('^' + collection.toLowerCase() + '-' + paddedVersion));
  });

  return versions.length > 0 ? versions[0] : false;
};