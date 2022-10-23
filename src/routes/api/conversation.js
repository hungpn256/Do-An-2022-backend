const router = require("express").Router();
const Post = require("../../models/post.js");
const User = require("../../models/user.js");
const Comment = require("../../models/comment.js");
const Like = require("../../models/like.js");
const Conversation = require("../../models/conversation");
const Message = require("../../models/message");
const SocketModel = require("../../models/socket");
const CronJob = require("cron").CronJob;

const { requireSignin } = require("../../middleware/index.js");
const mongoose = require("mongoose");
const { Types } = mongoose;
const { ObjectId } = Types;

router.get("/unseen", requireSignin, async (req, res) => {
  const user = req.user;
  const { _id } = user;
  try {
    const queryUnseen = await Conversation.aggregate([
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "conversation",
          as: "messages",
        },
      },
      {
        $match: {
          "messages.0": { $exists: true },
          "participants.user": ObjectId(_id),
        },
      },
      {
        $addFields: {
          me: {
            $arrayElemAt: [
              "$participants",
              {
                $indexOfArray: ["$participants.user", ObjectId(_id)],
              },
            ],
          },
        },
      },
      {
        $addFields: {
          messUnSeen: {
            $filter: {
              input: "$messages",
              as: "messages",
              cond: {
                $and: [
                  { $gt: ["$$messages.createdAt", "$me.lastSeen"] },
                  { $ne: ["$$messages.createdBy", "$me.user"] },
                ],
              },
            },
          },
        },
      },
      { $match: { "messUnSeen.0": { $exists: true } } },

      // {
      //   $project: {
      //     messUnSeen: 1,
      //   },
      // },
      {
        $count: "numOfConversationUnseen",
      },
    ]);
    const numOfConversationUnseen =
      queryUnseen.length > 0 ? queryUnseen[0].numOfConversationUnseen : 0;

    return res.status(200).json({
      success: true,
      numOfConversationUnseen: numOfConversationUnseen,
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: "Some thing went wrong",
      error: e.message,
    });
  }
});

router.post("/unseen", requireSignin, async (req, res) => {
  try {
    const user = req.user;
    const { _id } = user;
    const { conversationId } = req.body;

    const conversation = await Conversation.findOne({ _id: conversationId });
    if (conversation) {
      conversation.participants.forEach((i) => {
        if (i.user.toString() === _id) {
          i.lastSeen = Date.now();
        }
      });
      await conversation.save();
      return res.status(200).json({
        success: true,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Conversation not found",
        error: e.message,
      });
    }
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: "Some thing went wrong",
      error: e.message,
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
    const conversationUpdated = await Conversation.findById(conversationId);
    Object.keys(data).forEach((key) => {
      conversationUpdated[key] = data[key];
    });
    await conversationUpdated.save();
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
    )
      .populate({
        path: "participants.user",
        select: {
          avatar: 1,
          fullName: 1,
          status: 1,
        },
      })
      .populate("pinMessage");
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

router.post("/cron", requireSignin, async (req, res) => {
  try {
    const time = req.body.time;
    const message = req.body.message;
    const conversationId = req.body.conversationId;

    const job = new CronJob(
      new Date(time),
      async () => {
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
            $in: conversationUpdated.participants.map((i) => i.user._id),
          },
        });
        listSocketConversation.forEach((item) => {
          io.to(item.socket).emit("new-message", conversationUpdated);
        });
      },
      undefined,
      true,
      "UTC"
    );
    job.start();

    return res.status(200).json({
      success: true,
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: "Some thing went wrong",
      error: e.message,
    });
  }
});

router.post("/change-nickname", requireSignin, async (req, res) => {
  try {
    const { userId, nickName, conversationId } = req.body;
    const conversation = await Conversation.findById(conversationId);
    // conversation.participants.forEach((i) => {
    //   if (i.user === ObjectId(userId)) {
    //     i.nickName === nickName;
    //   }
    // });
    await Conversation.updateOne(
      { _id: conversationId, "participants.user": userId },
      {
        $set: {
          "participants.$.nickName": nickName,
        },
      }
    );
    await conversation.save();
    const io = res.app.get("socketio");
    const users = conversation.participants.map((i) => i.user);
    const listSocket = await SocketModel.find({
      user: {
        $in: users,
      },
    });
    listSocket.forEach((item) => {
      io.to(item.socket).emit("change-nickname", {
        userId,
        nickName,
        conversationId,
      });
    });
    return res.status(200).json({
      success: true,
      message: "Change nickname successfully",
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: "Get conversation error",
      error: e,
    });
  }
});

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
    return res.status(400).json({
      success: false,
      message: "Get conversation error",
      error: e,
    });
  }
});

module.exports = router;
