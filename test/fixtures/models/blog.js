/**
 * @author Josh Stuart <joshstuartx@gmail.com>
 */

var mongoose = require('mongoose');
var User = require('./user');
var Comment = require('./comment');
var Schema = mongoose.Schema;

var BlogSchema = new Schema({
    title: String,
    body: String,
    postedOn: Date,
    updatedOn: Date,
    slug: String,
    author: {
        type: User.schema
    },
    comments: {
        type: [Comment.schema],
        default: []
    }
});

module.exports = mongoose.model('Blog', BlogSchema);
