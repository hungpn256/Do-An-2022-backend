const mongoose = require('mongoose');

// User Schema
const postSchema = new mongoose.Schema({
  text: {
    type: String,
  },
  action: {
    type: String,
  },
  images: [
    {
      url: String,
    },
  ],
  liked: {
    type: Number,
    default: 0,
  },
  numOfCmt: {
    type: Number,
    default: 0,
  },
  createBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createAt: {
    type: Date,
    default: Date.now,
  },
  updateAt: {
    type: Date,
  },
});

module.exports = mongoose.model('Post', postSchema);
