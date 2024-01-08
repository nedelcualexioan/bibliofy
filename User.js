const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: String,
    author: String,
    categories: [String],
    image: String,
    year: Number,
    pages: Number
});

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    books: [bookSchema]
});

module.exports = mongoose.model('User', userSchema);
module.exports.book = mongoose.model('Book', bookSchema);