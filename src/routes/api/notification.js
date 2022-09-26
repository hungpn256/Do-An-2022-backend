const router = require("express").Router();
const { requireSignin } = require("../../middleware/index.js");
const Notification = require("../../models/notification");

router.get("/unSeen", requireSignin, async (req, res) => {
  try {
    const _id = req.user._id;
    const total = await Notification.find({
      userRelative: _id,
      userSeen: {
        $ne: _id,
      },
    }).countDocuments();
    return res.status(200).json({
      success: true,
      total,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
      error,
    });
  }
});

router.get("/", requireSignin, async (req, res) => {
  try {
    const _id = req.user._id;
    const total = await Notification.find({
      userRelative: _id,
    }).countDocuments();

    const notifications = await Notification.find({
      userRelative: _id,
    })
      .populate("post")
      .populate("comment")
      .populate("friend");
    return res.status(200).json({
      success: true,
      notifications,
      total,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
      error,
    });
  }
});
module.exports = router;
