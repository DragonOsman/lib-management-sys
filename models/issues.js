const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema({
  patron: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true
  },
  returned: {
    type: Boolean,
    default: false
  },
  over_due: {
    type: Boolean,
    default: false
  },
  amount_due: { // for whether a fine is due (in case of overdue, fine would be due)
    type: Number,
    default: 0.00,
    required: false
  }
}, {
  timestamps: true
});

const Issues = mongoose.model("Issue", issueSchema);

module.exports = Issues;
