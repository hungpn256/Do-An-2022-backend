const mongoose = require("mongoose");
// commentSchema
const callSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  endAt: {
    type: Date,
    default: null,
  },
  conversation: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      required: true,
    },
  ],
  paticipants: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      signal: {
        type: String,
        required: true,
      },
    },
  ],
});

callSchema.pre("find", function () {
  this.populate({
    path: "createdBy",
    select: {
      _id: 1,
      fullName: 1,
      avatar: 1,
    },
  })
    .populate("conversation")
    .populate({
      path: "paticipants.user",
      select: {
        _id: 1,
        fullName: 1,
        avatar: 1,
      },
    });
});

module.exports = mongoose.model("Call", callSchema);
