const mongoose = require('mongoose');

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
  password: {
    type: String,
    required: true,
  },
  gender: {
    type: Number,
    enum: [0, 1, 2],
    require: true,
  },
  avatar: {
    id: String,
    viewUrl: String,
    downloadUrl: String,
  },
  cover: {
    id: String,
    viewUrl: String,
    downloadUrl: String,
  },
  location: String,
  relation: String,
  updated: Date,
  created: {
    type: Date,
    default: Date.now,
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
  follow: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
});

userSchema.virtual('name').set(function () {
  return {
    firstName: this.firstName,
    lastName: this.lastName,
  };
});

module.exports = mongoose.model('User', userSchema);
