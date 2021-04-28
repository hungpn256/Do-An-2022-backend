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
  fullName: String,
  password: {
    type: String,
    required: true,
  },
  gender: {
    type: Number,
    enum: [0, 1, 2],
    require: true,
  },
  avatar: String,
  cover: String,
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

// userSchema.virtual('name').set(function () {
//   return `${this.firstName} ${this.lastName}`
// });

module.exports = mongoose.model('User', userSchema);
