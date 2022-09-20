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
    require: true,
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
        require: true,
      },
      nickName: {
        type: String,
        default: null,
      },
      lastSeen: {
        type: Date,
        default: Date.now,
      },
      lastDelete: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  updatedAt: {
    type: Date,
    default: Date.now,
    require: true,
  },
  name: {
    type: String,
    default: null,
  },
  pinMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
  },
});

conversationSchema.set("toObject", { virtuals: true });
conversationSchema.set("toJSON", { virtuals: true });

conversationSchema.virtual("messages", {
  ref: "Message",
  localField: "_id",
  foreignField: "conversation",
});

conversationSchema.virtual("numberOfMessages", {
  ref: "Message",
  localField: "_id",
  foreignField: "conversation",
  count: true,
});

module.exports = mongoose.model("Conversation", conversationSchema);
