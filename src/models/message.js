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
  type: {
    type: String,
    enum: ["MESSAGE", "NOTIFICATION"],
    default: "MESSAGE",
  },
  reply: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
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

messageSchema.pre("find", function () {
  this.populate("createdBy", "_id fullName avatar").populate("reply");
});

module.exports = mongoose.model("Message", messageSchema);
