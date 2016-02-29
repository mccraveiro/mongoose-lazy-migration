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

    // lowercase the collection
    opts.collection = opts.collection.toLowerCase();

    /**
     * Helper function that gets the current version. We use this to dynamically get the version because
     * caching it to a variable means we can't do multiple collections.
     *
     * @returns {number}
     */
    var getCurrentVersion = function() {
        return common.getCurrentVersion(opts.migrations_path, opts.collection) || 0;
    };

    /**
     * Provides a hash of files by version for the current collection.
     */
    var getMigrations = function() {
        return common.listByVersion(opts.migrations_path, opts.collection);
    };

    /**
     * This is where we execute the migrations before mongoose performs additional actions in its lifecycle.
     *
     * @param next
     * @param data
     */
    var preInit = function(next, data) {
        data[opts.version_field] = data[opts.version_field] || 0;

        // up
        while (data[opts.version_field] < getCurrentVersion()) {
            data = migrate(data, 'up');
        }

        // down
        while (data[opts.version_field] > getCurrentVersion()) {
            data = migrate(data, 'down');
        }

        next();
    };

    /**
     * Executes the imported migration actions.
     *
     * @param data
     * @param action
     * @returns {Object}
     */
    var migrate = function(data, action) {
        var migrations = getMigrations();
        var migration;
        var migrationName;
        var newData;

        if (action == 'up') {
            try {
                data[opts.version_field]++;
                migrationName = migrations[data[opts.version_field]];
                migration = require(opts.migrations_path + migrationName).up;
            } catch (err) {
                throw new Error('Could not run "up" migration file with the path ' + opts.migrations_path + migrationName);
            }
        } else if (action == 'down') {
            try {
                migrationName = migrations[data[opts.version_field]];
                migration = require(opts.migrations_path + migrationName).down;
                data[opts.version_field]--;
            } catch (err) {
                throw new Error('Could not run "down" migration file with the path ' + opts.migrations_path + migrationName);
            }
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

        opts.model.update({_id: newData._id}, {$unset: newData['$unset']}, {strict: false}, errorHandler);

        delete newData['$unset'];
        return newData;
    };

    /**
     * This is where the data changed in migration is saved. It is executed after the migration is complete, but before
     * mongoose finishes its full init lifecycle.
     *
     * @param data
     */
    var postInit = function(data) {
        data.update(data.toObject(), errorHandler);
    };

    var errorHandler = function(error) {
        if (error) {
            console.error('mongoose-lazy-migrations', error);
        }
    };

    // set VERSION_FIELD
    newField = {};
    newField[opts.version_field] = {
        type: Number,
        default: getCurrentVersion()
    };

    schema.add(newField);
    schema.pre('init', preInit.bind(this));
    schema.post('init', postInit.bind(this));
}

module.exports = Plugin;
