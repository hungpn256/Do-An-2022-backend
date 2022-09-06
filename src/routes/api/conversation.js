const router = require("express").Router();
const Post = require("../../models/post.js");
const User = require("../../models/user.js");
const Comment = require("../../models/comment.js");
const Like = require("../../models/like.js");
const Conversation = require("../../models/conversation");

const { requireSignin } = require("../../middleware/index.js");
const mongoose = require("mongoose");
router.post("/", requireSignin, async (req, res) => {
  try {
    const user = req.user;
    const { _id } = user;
    const { targetIds } = req.body;
    const target = [
      { "participants.user": _id },
      ...targetIds.map((i) => {
        return { "participants.user": i };
      }),
    ];

    const conversations = await Conversation.find({
      $and: [...target, { type: "PRIVATE" }],
    });

    if (conversations.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Get conversation successfully",
        conversation: conversations[0],
      });
    } else {
      const newConversation = new Conversation({
        host: _id,
        participants: [
          { user: _id },
          ...targetIds.map((i) => {
            return { user: i };
          }),
        ],
      });

      const conversationSave = await newConversation.save();

      return res.status(200).json({
        success: true,
        message: "Get conversation successfully",
        conversation: conversationSave,
      });
    }
  } catch (e) {
    console.log(e);
    return res.status(400).json({
      success: false,
      message: "Get conversation error",
      error: e,
    });
  }
});

router.get("/", requireSignin, async (req, res) => {
  try {
    const user = req.user;
    const { _id } = user;

    const conversations = await Conversation.find({ participants: _id });

    return res.status(200).json({
      success: true,
      conversations: conversations,
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: "Some thing went wrong",
      error: e,
    });
  }
});

module.exports = router;
