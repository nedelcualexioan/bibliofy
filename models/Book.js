const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  description: String,
  category: String,
  image: String,
  year: Number,
  pages: Number,
  price: Number,
});

module.exports = mongoose.model("Book", bookSchema);