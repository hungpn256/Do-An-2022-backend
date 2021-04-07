const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  text: String,
  imgs: [
    {
      type: String
    }
  ],
  liked: {
    type: Number
  },
  createBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createAt: {
    type: Date,
    default: Date.now,
  },
  updateAt: {
    type: Date
  }
});

module.exports =  mongoose.model('Comment', commentSchema);