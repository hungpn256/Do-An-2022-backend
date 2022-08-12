const mongoose = require("mongoose");

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
});

userSchema.virtual("name").set(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model("User", userSchema);
