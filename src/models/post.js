const mongoose = require('mongoose');

// Post Schema
const postSchema = new mongoose.Schema({
  text: {
    type: String,
  },
  textAccent: String,
  action: {
    type: String,
  },
  images: [
    {
      url: String,
    },
  ],
  liked: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Like',
  }],
  createBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  comment: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
  }]
});

module.exports = mongoose.model('Post', postSchema);
