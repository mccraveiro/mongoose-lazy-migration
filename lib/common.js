var fs = require('fs');

/**
 * Gets the current version of the migration for the provided collection and directory.
 *
 * @param directory
 * @param collection
 * @returns {number}
 */
exports.getCurrentVersion = function(directory, collection) {
    try {
        return (require(directory + '.versions.json')[collection.toLowerCase()]);
    } catch (err) {
        throw new Error('Could not read versions file: ' + directory + '.versions.json');
    }
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

    return list.reduce(function(prev, value) {
        var version = parseInt(value.match(/-(\d{4})-/)[1], 10);
        prev[version] = value;
        return prev;
    }, {});
};

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
