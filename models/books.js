const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  isbn: {
    type: String,
    required: true,
    unique: true
  },
  publication_date: {
    type: Date,
    required: false
  },
  description: {
    type: String,
    default: "--Not available--"
  },
  cat: {
    type: String,
    enum: [
            "Romance", "Technology", "Computer Science", "Management",
            "Electronics", "Physics", "Chemistry", "Mathematics",
            "Fiction", "Philosophy", "Language", "Arts", "Fantasy",
            "Science Fiction", "Other"
          ],
    required: true
  },
  copies: {
    type: Number,
    min: 1,
    max: 1000,
    required: true
  }
}, {
  timestamps: true
});

const Book = mongoose.model("Book", BookSchema);

module.exports = Book;