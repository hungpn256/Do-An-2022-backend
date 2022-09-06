const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ["GROUP", "PRIVATE"],
    default: "PRIVATE",
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  participants: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      nickName: {
        type: String,
        default: null,
      },
      lastSeen: {
        type: Date,
      },
      lastDelete: {
        type: Date,
      },
    },
  ],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  name: {
    type: String,
  },
  pinMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
  },
});

module.exports = mongoose.model("Conversation", conversationSchema);
