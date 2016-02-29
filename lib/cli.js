#!/usr/bin/env node

var path = require('path');
var fs = require('fs');
var slug = require('slug');
var common = require('./common');

var collection = process.argv[3];
var migrations_path = process.cwd() + '/migrations/';
var versionsFile = migrations_path + '.versions.json';
var create;

var stringify = function(json) {
    return JSON.stringify(json, null, 4);
};

var incrementVersion = function(collection) {
    var versions = require(versionsFile);
    var currentVersion = versions[collection];
    var nextVersion = currentVersion ? currentVersion + 1 : 1;

    versions[collection] = nextVersion;
    fs.writeFileSync(versionsFile, stringify(versions));
};

exports.create = create = function(collection, label) {
    collection = collection.toLowerCase();

    var versions = require(versionsFile);
    var templateFileName = path.join(__dirname, '..', 'templates', 'table-0000-label.js');
    var migrationLabel = slug(label);
    var version = versions[collection] || 0;
    var nextVersion = version + 1;
    var fileParts = [
        collection,
        String('0000' + nextVersion).slice(-4),
        migrationLabel
    ];
    var fileName = migrations_path + fileParts.join('-') + '.js';

    // Copy template file to migration file
    fs.writeFileSync(fileName, fs.readFileSync(templateFileName));

    // Update migration versions
    incrementVersion(collection);

    console.log('\nCreated ./migrations/' + fileParts.join('-') + '.js\n');
};

if (require.main === module) {
    switch (process.argv[2]) {
        case 'create':
            create(process.argv[3].toLowerCase(), process.argv.slice(4).join('-'));
            break;
    }
}
