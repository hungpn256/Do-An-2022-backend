const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    enum: [
      "LIKE_POST",
      "LIKE_COMMENT",
      "REPLY_COMMENT",
      "COMMENT_POST",
      "ACCREP_FRIEND",
    ],
    default: "LIKE_POST",
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
  },
  comment: {
    newComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  },
  friend: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Friend",
  },
  userSeen: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  userRelative: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

notificationSchema.pre("save", function () {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model("Notification", notificationSchema);
