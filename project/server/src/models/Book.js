const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  isbn: String,
  genre: String,
  stock: Number,
  rating: Number,
  relatedBooks: [String], // array of other ISBNs or titles
});

module.exports = mongoose.model('Book', bookSchema);
