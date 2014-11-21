var mongoose = require('mongoose');
var common = require('./common');

module.exports = exports = function(schema, options) {

  var MIGRATIONS_PATH = process.cwd() + '/migrations/';
  var VERSION_FIELD = '__m';  // Hardcoding for now

  var migrations = require(MIGRATIONS_PATH);
  var newField = {};

  newField[VERSION_FIELD] = { type: Number, default: 0 };
  schema.add(newField);

  schema.static('migrate', function(docs, done) {
    common.migrate(docs, done);
  });

  schema.pre('init', function(next, data) {
    var modelName = this.constructor.modelName;
    var versions = migrations.listByVersion(modelName);
    var latestVersion = common.getLatestVersion(modelName);

    data[VERSION_FIELD] = data[VERSION_FIELD] || 0;

    // up
    while (data[VERSION_FIELD] < latestVersion) {
      data = migrate(data, 'up');
    }

    // down
    while (data[VERSION_FIELD] > latestVersion) {
      data = migrate(data, 'down');
    }

    function migrate(data, action) {
      var migration;

      if (action == 'up') {
        data[VERSION_FIELD]++;
        migration = require(MIGRATIONS_PATH + versions[data[VERSION_FIELD]]).up;
      } else if (action == 'down') {
        migration = require(MIGRATIONS_PATH + versions[data[VERSION_FIELD]]).down;
        data[VERSION_FIELD]--;
      }

      if (migration) {
        return migration(data);
      } else {
        console.error('mongoose-lazy-migrations', 'migration not found');
        return data;
      }
    }

    next();
  });

  schema.post('init', function (data) {
    data.update(data.toObject(), function (error) {
      if (error) {
        console.error('mongoose-lazy-migrations', error);
      }
    });
  });
};