const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
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
  },
  { strict: false }
);

conversationSchema.set("toObject", { virtuals: true });
conversationSchema.set("toJSON", { virtuals: true });

conversationSchema.virtual("messages", {
  ref: "Message",
  localField: "_id",
  foreignField: "conversation",
  // count: true,
});

conversationSchema.virtual("numberOfMessages", {
  ref: "Message",
  localField: "_id",
  foreignField: "conversation",
  count: true,
});

module.exports = mongoose.model("Conversation", conversationSchema);
