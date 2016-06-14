var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var ItemSchema   = new Schema({
    customerId: String,
    name: String,
    type: String,
    id: String,
    hash: String
});

module.exports = mongoose.model('Item', ItemSchema);