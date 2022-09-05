const router = require("express").Router();
const Post = require("../../models/post.js");
const User = require("../../models/user.js");
const Comment = require("../../models/comment.js");
const Like = require("../../models/like.js");
const Conversation = require("../../models/conversation");

const { requireSignin } = require("../../middleware/index.js");

router.post("/", requireSignin, async (req, res) => {
    try {
        const user = req.user;
        const { _id } = user;
        const { targetIds } = req.body;

        const newConversation = new Conversation({
            host: _id,
            paticipant: [_id, ...targetIds]
        });

        const conversationSave = await newConversation.save();

        return res.status(200).json({
            success: true,
            message: "You can't save post.",
            conversation: conversationSave
        });
    } catch (e) {
        return res.status(400).json({
            success: false,
            message: "You can't save post.",
            error: e
        });
    }
});

router.get("/", requireSignin, async (req, res) => {
    try {
        const user = req.user;
        const { _id } = user;

        const conversations = await Conversation.find({ paticipants: _id })

        return res.status(200).json({
            success: true,
            conversations: conversations
        });
    } catch (e) {
        return res.status(400).json({
            success: false,
            message: "Some thing went wrong",
            error: e
        });
    }
});


module.exports = router;
