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
      typeMedia: {
        type: String,
        enum: ["IMAGE", "VIDEO"],
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
  reply: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
});

commentSchema.pre("find", function () {
  this.populate({
    path: "createdBy",
    select: {
      _id: 1,
      fullName: 1,
      avatar: 1,
    },
  }).populate("reply liked");
});

module.exports = mongoose.model("Comment", commentSchema);
