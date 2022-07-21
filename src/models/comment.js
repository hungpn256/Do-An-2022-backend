const mongoose = require("mongoose");
// commentSchema
const commentSchema = new mongoose.Schema({
  content: {
    type: String,
  },
  file: [
    {
      url: {
        type: String,
      },
    },
  ],
  liked: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Like",
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
  },
});

module.exports = mongoose.model("Comment", commentSchema);
