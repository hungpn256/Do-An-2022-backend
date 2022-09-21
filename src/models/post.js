const mongoose = require("mongoose");

// Post Schema
const postSchema = new mongoose.Schema({
  text: {
    type: String,
  },
  action: {
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
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  comment: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
});

postSchema.pre("find", function () {
  this.populate([
    {
      path: "createdBy",
      select: {
        avatar: 1,
        fullName: 1,
      },
    },
    {
      path: "liked",
    },
    {
      path: "comment",
    },
  ]);
});

postSchema.pre("findOne", function () {
  this.populate([
    {
      path: "createdBy",
      select: {
        avatar: 1,
        fullName: 1,
      },
    },
    {
      path: "liked",
    },
    {
      path: "comment",
    },
  ]);
});

module.exports = mongoose.model("Post", postSchema);
