const router = require("express").Router();
const Call = require("../../models/call.js");

router.post("/", requireSignin, async (req, res) => {
  try {
    const userId = req.user._id;
    const conversationId = req.body.conversationId;
    const callCurrent = await Call.find({
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
      .populate("conversation");
    if (callCurrent) {
      return res.status(200).json({
        success: true,
        call: callCurrent,
      });
    }

    const call = new Call({
      conversationL: conversationId,
      paticipants: [],
      createdBy: userId,
    });

    await call.save();

    const newCall = await Call.populate(call)
      .populate({
        path: "participants.user",
        select: {
          avatar: 1,
          fullName: 1,
          status: 1,
        },
      })
      .populate("conversation");

    return res.status(200).json({
      success: true,
      call: newCall,
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
