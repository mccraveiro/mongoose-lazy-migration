/**
 * @author Josh Stuart <joshstuartx@gmail.com>
 */
var q = require('q');
var mongoose = require('mongoose');
var CONNECTION_STRING = 'mongodb://localhost:27017/mongoose-lazy-migration-test';

/**
 * A DB util class that abstracts mongoose functions.
 *
 * @varructor
 */
function Db(options) {
    options = options || {}; // eslint-disable-line no-param-reassign
    this.autoReconnect = options.autoReconnect || false;
}

/**
 * Returns the mongo connection url based on the current config.
 *
 * @returns {string}
 * @private
 */
function getConnectionUrl() {
    return CONNECTION_STRING;
}

/**
 * Instantiate the database connection
 *
 * @returns {Promise}
 * @public
 */
Db.prototype.connect = function() {
    var connect;
    var deferred = q.defer();

    if (!this._db || this._db.readyState !== mongoose.Connection.STATES.connected) {
        // Connect to mongodb
        connect = function() {
            var options = {server: {socketOptions: {keepAlive: 1}}};

            mongoose.connect(getConnectionUrl(), options);
        };

        // connect to mongo
        connect();

        this._db = mongoose.connection;

        this._db.on('error', function() {
            throw new Error('unable to connect to database using: ' + getConnectionUrl());
        });

        this._db.on('connected', function() {
            deferred.resolve();
        });

        this._db.on('disconnected', function() {
            if (this.autoReconnect) {
                connect();
            }
        }.bind(this));
    } else {
        // the db is still connected, so just resolve
        deferred.resolve();
    }

    return deferred.promise;
};

/**
 * Disconnects mongoose connection.
 * @public
 */
Db.prototype.disconnect = function() {
    if (!!this._db && this._db.readyState === mongoose.Connection.STATES.connected) {
        this.autoReconnect = false;
        this._db.close();
        this._db = undefined;
    }
};

/**
 * A wrapper around the mongoose save function and returns a promise.
 * @param object
 * @returns {Promise}
 * @public
 */
Db.prototype.create = function(object) {
    return q.ninvoke(object, 'save').
    then(function(result) {
        if (result.constructor === Array && result.length > 0) {
            return result[0];
        }
        return result;
    });
};

/**
 * A wrapper around the mongoose save function to 'update', even though they are the same thing as create,
 * other ODMs may differ so this is a way to hedge for the future.
 *
 * @param object
 */
Db.prototype.update = function(object) {
    return q.ninvoke(object, 'save').
    then(function(result) {
        if (result.constructor === Array && result.length > 0) {
            return result[0];
        }
        return result;
    });
};

/**
 * Imports data by iterating and instantiating a schema one at a time, using serial promises.
 *
 * @param Schema
 * @param data
 * @returns {Promise}
 * @public
 */
Db.prototype.import = function(Schema, data) {
    return data.reduce(function(promise, entry) {
        return this.create(new Schema(entry));
    }.bind(this), q.resolve());
};

/**
 * Removes all data from the passed collection schema.
 *
 * @param Schema
 * @returns {Promise}
 * @public
 */
Db.prototype.removeAll = function(Schema) {
    return q.ninvoke(Schema, 'remove', {});
};

/**
 * A wrapper function for the mongoose 'find'.
 *
 * @param Schema
 * @param options
 * @returns {Promise}
 * @public
 */
Db.prototype.findAll = function(Schema, options) {
    var query;

    if (!options) {
        options = { // eslint-disable-line no-param-reassign
            criteria: {}
        };
    } else if (!options.criteria) {
        options.criteria = {};
    }

    query = Schema.find(options.criteria);

    if (!!options.populate) {
        query.populate(options.populate);
    }

    if (!!options.lean) {
        query.lean();
    }

    if (!!options.select) {
        query.select(options.select);
    }

    return this.execute(query);
};

/**
 * A wrapper function for the mongoose 'findOne'.
 *
 * @param Schema
 * @param options
 * @returns {Promise}
 * @public
 */
Db.prototype.find = function(Schema, options) {
    var query;

    if (!options) {
        options = { // eslint-disable-line no-param-reassign
            criteria: {}
        };
    } else if (!options.criteria) {
        options.criteria = {};
    }

    query = Schema.findOne(options.criteria);

    if (!!options.populate) {
        query = query.populate(options.populate);
    }

    if (!!options.lean) {
        query.lean();
    }

    if (!!options.select) {
        query.select(options.select);
    }

    return this.execute(query);
};

/**
 * Wraps a mongoose query in a 'q' promise.
 *
 * @param query
 * @returns {Promise}
 * @public
 */
Db.prototype.execute = function(query) {
    var deferred = q.defer();

    query.exec(function(err, results) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(results);
        }
    });

    return deferred.promise;
};

/**
 * Returns the mongo connection.
 *
 * @returns {*}
 * @public
 */
Db.prototype.getConnection = function() {
    return this._db;
};

module.exports = new Db();
