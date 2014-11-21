// Migrate a record forward
exports.up = function(data) {
  // ... data.xxx = 123;
  return data;
};

// Rollback record
exports.down = function(data, done) {
  // ... data.xxx = undefined;
  return data;
};
