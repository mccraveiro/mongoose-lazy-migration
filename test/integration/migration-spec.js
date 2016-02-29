/**
 * @author Josh Stuart <joshstuartx@gmail.com>
 */
var q = require('q');
var should = require('should');
var moment = require('moment-timezone');
var _ = require('lodash');
var migrate = require('../../lib/plugin');
var db = require('../utils/db');
var User = require('../fixtures/models/user');
var userFixture = require('../fixtures/data/users');
var Blog = require('../fixtures/models/blog');
var blogFixture = require('../fixtures/data/blogs');
var MIGRATIONS_PATH = __dirname + '/../fixtures/migrations/';

/**
 * Generic way to find by.
 *
 * @param collection
 * @param value
 * @param key
 * @returns {Object}
 */
function findBy(collection, value, key) {
    return _.find(collection, function(object) {
        return object[key] === value;
    });
}

/**
 * Find a user in a collection by their name.
 *
 * @param users
 * @param firstName
 * @returns {Object}
 */
function findUserByFirstName(users, firstName) {
    return findBy(users, firstName, 'firstName');
}

/**
 * Find a blog in a collection by an id.
 *
 * @param blogs
 * @param id
 * @returns {Object}
 */
function findBlogById(blogs, id) {
    return findBy(blogs, id, 'id');
}

describe('Migration Integration Specs', function() {
    before(function(done) {
        db.connect().
        then(function() {
            done();
        });
    });

    after(function(done) {
        done();
    });

    beforeEach(function(done) {
        q.all([
            db.import(User, userFixture),
            db.import(Blog, blogFixture)
        ]).
        then(function() {
            // apply the migration plugin to Users
            User.schema.plugin(migrate, {
                collection: 'users',
                model: User,
                migrations_path: MIGRATIONS_PATH
            });

            // apply the migration plugin to Blogs
            Blog.schema.plugin(migrate, {
                collection: 'blogs',
                model: Blog,
                migrations_path: MIGRATIONS_PATH
            });

            done();
        });
    });

    afterEach(function(done) {
        q.all([
            db.removeAll(User),
            db.removeAll(Blog)
        ]).
        then(function() {
            done();
        });
    });

    it('should run 2 migrations across the user collection and 1 across the blog collection', function(done) {
        // run migration by querying
        db.findAll(User).
        then(function(users) {
            var elon = findUserByFirstName(users, 'Elon');
            var mark = findUserByFirstName(users, 'Mark');
            var sergey = findUserByFirstName(users, 'Sergey');
            var arianna = findUserByFirstName(users, 'Arianna');
            var sheryl = findUserByFirstName(users, 'Sheryl');

            // ensure migration has run up to the 2nd
            elon.toObject().__m.should.eql(2);
            mark.toObject().__m.should.eql(2);
            sergey.toObject().__m.should.eql(2);
            arianna.toObject().__m.should.eql(2);
            sheryl.toObject().__m.should.eql(2);

            // check last name migration user-0001
            elon.lastName.should.eql('Musk');
            mark.lastName.should.eql('Zuckerberg');
            sergey.lastName.should.eql('Brin');
            arianna.lastName.should.eql('Huffington');

            // check nick name migration user-0002
            should.not.exist(elon.nickname);
            mark.nickname.should.eql('Zuck');
            sergey.nickname.should.eql('G-Man');
            sheryl.nickname.should.eql('Sandbags');

            // run migration for blogs
            return db.findAll(Blog);
        }).
        then(function(blogs) {
            var updatedOn = moment('2016-02-29 00:00').tz('Australia/Melbourne');
            var elonBlog = findBlogById(blogs, '56d3de05fb3ebd8320fca69a');
            var sherylBlog = findBlogById(blogs, '56d3df763e98829b22230866');

            // ensure migration has run up to the 1st
            elonBlog.toObject().__m.should.eql(1);
            sherylBlog.toObject().__m.should.eql(1);

            // check migrations blogs-0001
            elonBlog.updatedOn.should.eql(updatedOn.toDate());
            elonBlog.title.should.eql('GM Killed the Electric Car, Tesla Revived It!');
            elonBlog.slug.should.eql('gm-killed-the-electric-car-tesla-revived-it');

            sherylBlog.updatedOn.should.eql(updatedOn.toDate());
            sherylBlog.title.should.eql('Lean In: Women, Work, and the Will to Lead');
            sherylBlog.slug.should.eql('lean-in-women-work-and-the-will-to-lead');

            done();
        });
    });
});
