/**
 * @author Josh Stuart <joshstuartx@gmail.com>
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    firstName: String,
    lastName: String,
    nickname: String,
    social: {
        facebook: String,
        twitter: String,
        instagram: String
    }
});

module.exports = mongoose.model('User', UserSchema);
