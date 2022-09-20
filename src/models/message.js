const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  content: {
    type: String,
  },
  files: [
    {
      url: String,
      typeMedia: {
        type: String,
        enum: ["IMAGE", "VIDEO"],
      },
    },
  ],
  reply: {
    type: mongoose.Schema.Types.ObjectId,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

messageSchema.set("toObject", { virtuals: true });
messageSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Message", messageSchema);
