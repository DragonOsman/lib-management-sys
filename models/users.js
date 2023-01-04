const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  firstname: {
    type: String,
    required: true
  },
  lastname: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  account_type: {
    type: String,
    default: "local"
  },
  roll: {
    type: String,
    required: true,
    unique: true
  },
  admin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const User = mongoose.model("User", UserSchema);
User.plugin(passportLocalMongoose);

module.exports = User;
