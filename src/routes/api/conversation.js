const router = require("express").Router();
const Post = require("../../models/post.js");
const User = require("../../models/user.js");
const Comment = require("../../models/comment.js");
const Like = require("../../models/like.js");
const Conversation = require("../../models/conversation");
const Message = require("../../models/message");
const SocketModel = require("../../models/socket");

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

    const type = targetIds.length > 1 ? "GROUP" : "PRIVATE";

    const conversations = await Conversation.find({
      $and: [...target, { type }],
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
        path: "messages",
        options: {
          sort: { createdAt: -1 },
          limit: 1,
          populate: {
            path: "createdBy",
            select: {
              avatar: 1,
              fullName: 1,
              status: 1,
            },
          },
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
        type,
      });

      const conversationSave = await newConversation.save();
      const conversationPopulate = await Conversation.findById(
        conversationSave._id
      )
        .populate({
          path: "messages",
          perDocumentLimit: 1,
          options: {
            sort: { createdAt: -1 },
            populate: {
              path: "createdBy",
              select: {
                _id: 1,
                avatar: 1,
                fullName: 1,
              },
            },
          },
        })
        .populate({
          path: "participants.user",
          select: {
            _id: 1,
            avatar: 1,
            fullName: 1,
          },
        })
        .populate({
          path: "numberOfMessages",
        });
      return res.status(200).json({
        success: true,
        message: "Get conversation successfully",
        conversation: conversationPopulate,
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
    const lastConversationUpdatedAt = req.query.lastConversationUpdatedAt;
    const textSearch = req.query.textSearch;
    const user = req.user;
    const { _id } = user;
    const conversationIdHaveMessage = await Message.find().distinct(
      "conversation"
    );
    const query = {
      _id: { $in: conversationIdHaveMessage },
      "participants.user": _id,
    };

    const total = await Conversation.find(query).countDocuments();

    if (lastConversationUpdatedAt) {
      query.updatedAt = {
        $gt: lastConversationUpdatedAt,
      };
    }

    const conversations = await Conversation.find(query)
      .limit(limit)
      .sort({ updatedAt: -1 })
      .populate({
        path: "messages",
        perDocumentLimit: 1,
        options: {
          sort: { createdAt: -1 },
          populate: {
            path: "createdBy",
            select: {
              _id: 1,
              avatar: 1,
              fullName: 1,
            },
          },
        },
      })
      .populate({
        path: "participants.user",
        select: {
          _id: 1,
          avatar: 1,
          fullName: 1,
        },
      })
      .populate({
        path: "numberOfMessages",
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

router.get("/:conversationId/message", requireSignin, async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const lastMessageId = req.query.lastMessageId;
    const conversationId = req.params.conversationId;
    const query = {
      conversation: conversationId,
    };
    const total = await Message.find({ ...query }).countDocuments();
    if (lastMessageId) {
      query._id = { $lt: lastMessageId };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({
        path: "createdBy",
        select: {
          avatar: 1,
          fullName: 1,
          status: 1,
        },
      });

    return res.status(200).json({
      success: true,
      messages: messages,
      total,
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: "Some thing went wrong",
      error: e,
    });
  }
});

router.put("/:conversationId", requireSignin, async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    const data = req.body;
    const conversationUpdated = await Conversation.findByIdAndUpdate(
      conversationId,
      data,
      { new: true }
    );

    return res.status(200).json({
      success: true,
      conversation: conversationUpdated,
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
    const conversationId = req.body.conversationId;
    const conversationUpdated = await Conversation.findByIdAndUpdate(
      conversationId,
      { updatedAt: Date.now() }
    ).populate({
      path: "participants.user",
      select: {
        avatar: 1,
        fullName: 1,
        status: 1,
      },
    });
    message.createdBy = req.user._id;

    const newMessages = new Message(message);
    const messageSave = await newMessages.save();
    const messageResp = await Message.populate(messageSave, {
      path: "createdBy",
      select: {
        avatar: 1,
        fullName: 1,
        status: 1,
      },
    });
    conversationUpdated.messages = [messageResp];
    const io = res.app.get("socketio");
    const listSocketConversation = await SocketModel.find({
      user: {
        $in: conversationUpdated.participants
          .map((i) => i.user._id)
          .filter((i) => i.toString() !== req.user._id),
      },
    });
    listSocketConversation.forEach((item) => {
      io.to(item.socket).emit("new-message", conversationUpdated);
    });
    return res.status(200).json({
      success: true,
      message: messageResp,
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
