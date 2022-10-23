const router = require("express").Router();
const { requireSignin } = require("../../middleware/index.js");
const Call = require("../../models/call.js");
const Conversation = require("../../models/conversation");
const SocketModel = require("../../models/socket");

router.post("/", requireSignin, async (req, res) => {
  try {
    const userId = req.user._id;
    const conversationId = req.body.conversationId;
    let callCurrent = await Call.findOne({
      conversation: conversationId,
      endAt: null,
    })
      .populate({
        path: "participants.user",
        select: {
          avatar: 1,
          fullName: 1,
          status: 1,
        },
      })
      .populate("conversation")
      .populate("createdBy");
    if (callCurrent) {
    } else {
      const newCall = new Call({
        conversation: conversationId,
        participants: [],
        createdBy: userId,
      });

      await newCall.save();
      callCurrent = await Call.findById(newCall)
        .populate({
          path: "participants.user",
          select: {
            avatar: 1,
            fullName: 1,
            status: 1,
          },
        })
        .populate("conversation")
        .populate("createdBy");
    }

    return res.status(200).json({
      success: true,
      call: callCurrent,
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: "Some thing went wrong",
      error: e.message,
    });
  }
});

router.get("/:callId", requireSignin, async (req, res) => {
  try {
    const callId = req.params.callId;
    let callCurrent = await Call.findById(callId)
      .populate({
        path: "participants.user",
        select: {
          avatar: 1,
          fullName: 1,
          status: 1,
        },
      })
      .populate("conversation")
      .populate("createdBy");
    if (callCurrent) {
      return res.status(200).json({
        success: true,
        call: callCurrent,
      });
    }
    return res.status(400).json({
      success: false,
      message: "Call not found",
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: "Some thing went wrong",
      error: e.message,
    });
  }
});

module.exports = router;
