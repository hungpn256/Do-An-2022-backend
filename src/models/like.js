const mongoose = require("mongoose");
//like schema
const likeSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  likedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

likeSchema.pre("find", function () {
  this.populate({
    path: "likedBy",
    select: {
      _id: 1,
      fullName: 1,
      avatar: 1,
    },
  });
});

module.exports = mongoose.model("Like", likeSchema);
