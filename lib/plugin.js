var _ = require('lodash');
var mongoose = require('mongoose');
var common = require('./common');

function Plugin(schema, options) {
  var newField;

  var opts = _.merge({
    collection: '',
    migrations_path: process.cwd() + '/migrations/',
    model: null,
    version_field: '__m'
  }, options);
  opts.collection = opts.collection.toLowerCase();

  var currentVersion = common.getCurrentVersion(opts.migrations_path, opts.collection);
  var migrations = common.listByVersion(opts.migrations_path, opts.collection);

  // set VERSION_FIELD
  newField = {};
  newField[opts.version_field] = {
    type: Number,
    default: currentVersion || 0
  };

  var preInit = function(next, data) {
    data[opts.version_field] = data[opts.version_field] || 0;

    // up
    while (data[opts.version_field] < currentVersion) {
      data = migrate(data, 'up');
    }

    // down
    while (data[opts.version_field] > currentVersion) {
      data = migrate(data, 'down');
    }

    next();
  }

  var migrate = function(data, action) {
    var migration, migrationName, newData, unset;

    if (action == 'up') {
      data[opts.version_field]++;
      migrationName = migrations[data[opts.version_field]];
      migration = require(opts.migrations_path + migrationName).up;
    } else if (action == 'down') {
      migrationName = migrations[data[opts.version_field]];
      migration = require(opts.migrations_path + migrationName).down;
      data[opts.version_field]--;
    }

    if (!migration) {
      console.error('mongoose-lazy-migrations', 'migration not found');
      return data;
    }

    newData = migration(data);

    if (newData['$unset'] === 'object') {
      for (var prop in newData['$unset']) {
        delete newData[prop];
      }
    } else {
      delete newData['$unset'];
    }

    opts.model.update({ _id: newData._id }, newData, { strict: false }, errorHandler);

    delete newData['$unset'];
    return newData;
  }

  var errorHandler = function(error) {
    if (error) {
      console.error('mongoose-lazy-migrations', error);
    }
  }

  schema.add(newField);
  schema.pre('init', preInit.bind(this));
};

module.exports = exports = Plugin;
