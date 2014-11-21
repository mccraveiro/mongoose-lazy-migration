#!/usr/bin/env node

var path = require('path');
var fs = require('fs');
var slug = require('slug');
var common = require('./common');

var tableName = process.argv[3];
var create;

var stringify = function(json) {
  return JSON.stringify(json, null, 4);
};

var incrementVersion = function(tableName) {
  var versions = common.readVersions();
  var versionsFileName = process.cwd() + '/migrations/.versions.json';

  versions[tableName] = versions[tableName] ? versions[tableName] + 1 : 1;

  fs.writeFileSync(versionsFileName, stringify(versions));
};

exports.create = create = function(tableName, label) {
  var versions = common.readVersions();
  var templateFileName = path.join(__dirname, '..', 'templates', 'table-0000-label.js');
  var migrationLabel = slug(label);
  var version = versions[tableName] || 0;
  var nextVersion = version + 1;
  var fileParts = [
    tableName.toLowerCase(),
    String('0000' + nextVersion).slice(-4),
    migrationLabel
  ];
  var fileName = process.cwd() + '/migrations/' + fileParts.join('-') + '.js';

  // Copy template file to migration file
  fs.writeFileSync(fileName, fs.readFileSync(templateFileName));

  // Update migration versions
  incrementVersion(tableName);

  console.log('\nCreated ./migrations/' + fileParts.join('-') + '.js\n');
};

if (require.main === module) {
  switch(process.argv[2]) {
    case 'create':
      create(process.argv[3].toLowerCase(), process.argv.slice(4).join('-'));
      break;
  }
}

