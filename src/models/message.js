const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    createdAt: {
        type: Date,
        default: Date.now
    },
    content: {
        type: String,
    },
    files: [{
        url: String,
        typeMedia: {
            type: String,
            enum: ["IMAGE", "VIDEO"],
        },
    }],
    reply: {
        type: mongoose.Schema.Types.ObjectId,
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation"
    }
});

module.exports = mongoose.model("Message", messageSchema);
