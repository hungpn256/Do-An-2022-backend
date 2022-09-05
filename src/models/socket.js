const mongoose = require("mongoose");
// friendSchema
const socketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  socket: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Socket", socketSchema);
