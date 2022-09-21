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
  content: {
    type: String,
  },
  files: {
    url: String,
    typeMedia: {
      type: String,
      enum: ["IMAGE"],
      default: "IMAGE",
    },
  },
  url: {
    type: String,
    ref: "Conversation",
  },
  type: {
    type: String,
    enum: ["FRIEND", "NOTIFICATION"],
    default: "FRIEND",
  },
  reply: {
    type: mongoose.Schema.Types.ObjectId,
  },
  userRelative: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

module.exports = mongoose.model("Notification", notificationSchema);
