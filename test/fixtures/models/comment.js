/**
 * @author Josh Stuart <joshstuartx@gmail.com>
 */

var mongoose = require('mongoose');
var User = require('./user');
var Schema = mongoose.Schema;

var CommentSchema = new Schema({
    title: String,
    body: String,
    postedOn: Date,
    author: {
        type: User.schema
    }
});

module.exports = mongoose.model('Comment', CommentSchema);
