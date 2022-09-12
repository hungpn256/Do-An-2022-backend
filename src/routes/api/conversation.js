const router = require("express").Router();
const Post = require("../../models/post.js");
const User = require("../../models/user.js");
const Comment = require("../../models/comment.js");
const Like = require("../../models/like.js");
const Conversation = require("../../models/conversation");
const Message = require("../../models/message");

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
    }).populate({
      path: "participants.user",
      select: {
        avatar: 1,
        fullName: 1,
        status: 1,
      },
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

      const conversationSave = await newConversation.save().populate({
        path: "participants.user",
        select: {
          avatar: 1,
          fullName: 1,
          status: 1,
        },
      });
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
    const limit = req.query.limit || 10;
    const lastConversationId = req.query.lastConversationId;
    const textSearch = req.query.textSearch;
    console.log("🚀 ~ file: conversation.js ~ line 79 ~ router.get ~ lastConversationId", lastConversationId)
    const user = req.user;
    const { _id } = user;
    const query = {
      _id: { $gt: lastConversationId },
      "participants.user": _id,
    };

    if (!lastConversationId) {
      delete query._id;
    }

    const total = await Conversation.find(query).countDocuments()

    const conversations = await Conversation.find(query)
      .limit(limit)
      .sort({ updatedAt: 1 })
      .populate({
        path: "messages",
        options: {
          sort: { createdAt: -1 },
          limit: 1,
        },
      })
      .populate({
        path: "participants.user",
        select: {
          avatar: 1,
          fullName: 1,
          status: 1,
        },
      })
      .populate({
        path: "numberOfMessages"
      });

    return res.status(200).json({
      success: true,
      conversations: conversations,
      total,
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: "Some thing went wrong",
      error: e.message,
    });
  }
});

router.get("/message/:conversationId", requireSignin, async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const lastMessageId = req.query.lastMessageId;
    const conversationId = req.params.conversationId;
    const query = {
      _id: { $lt: lastMessageId },
      conversation: conversationId,
    };
    if (!lastMessageId) {
      delete query._id;
    }

    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      messages: messages,
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: "Some thing went wrong",
      error: e,
    });
  }
});

router.post("/message", requireSignin, async (req, res) => {
  try {
    const message = req.body.message;
    message.createdBy = req.user._id;

    const newMessages = new Message(message);
    const messageSave = await newMessages.save();
    return res.status(200).json({
      success: true,
      message: messageSave,
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
