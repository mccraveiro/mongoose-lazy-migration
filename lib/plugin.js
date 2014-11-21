var _ = require('lodash');
var mongoose = require('mongoose');
var common = require('./common');

var currentVersion, migrations;
var opts = {
  collection: '',
  migrations_path: process.cwd() + '/migrations/',
  model: null,
  version_field: '__m'
}

function Plugin(schema, options) {
  var newField;

  opts = _.merge(opts, options);
  opts.collection = opts.collection.toLowerCase();

  currentVersion = common.getCurrentVersion(opts.migrations_path, opts.collection);
  migrations = common.listByVersion(opts.migrations_path, opts.collection);

  // set VERSION_FIELD
  newField = {};
  newField[opts.version_field] = {
    type: Number,
    default: currentVersion
  };

  schema.add(newField);
  schema.pre('init', preInit.bind(this));
  schema.post('init', postInit.bind(this));
};

function preInit(next, data) {
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

function migrate(data, action) {
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

  if (!newData['$unset'] || typeof newData['$unset'] !== 'object') {
    return newData;
  }

  for (var prop in newData['$unset']) {
    delete newData[prop];
  }

  opts.model.update({ _id: newData._id }, { $unset: newData['$unset'] }, { strict: false }, errorHandler);

  delete newData['$unset'];
  return newData;
}

function postInit(data) {
  data.update(data.toObject(), errorHandler);
}

function errorHandler(error) {
  if (error) {
    console.error('mongoose-lazy-migrations', error);
  }
}

module.exports = exports = Plugin;