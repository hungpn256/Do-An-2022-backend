const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
// User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  fullName: String,
  password: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    enum: ["MALE", "FEMALE", "OTHER"],
    require: true,
  },
  avatar: String,
  cover: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  friend: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  status: {
    type: String,
    enum: ["ONLINE", "OFFLINE"],
  },
  lastLogin: {
    type: Date,
  },
});

userSchema.pre("save", function (next) {
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(this.password, salt, (err, hash) => {
      this.password = hash;
      next();
    });
  });
  this.fullName = this.firstName + " " + this.lastName;
});

module.exports = mongoose.model("User", userSchema);
