const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
    createdAt: {
        type: Date,
        default: Date.now
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    paticipants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        nickName: {
            type: String,
        },
    }],
    updatedAt: {
        type: Date,
        default: Date.now
    },
    name: {
        type: String,
    }
});

module.exports = mongoose.model("Conversation", conversationSchema);
