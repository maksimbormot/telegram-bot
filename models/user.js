var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var UserSchema   = new Schema({
    customerId: String,
    pin: String,
    chatId: Number
});

module.exports = mongoose.model('User', UserSchema);