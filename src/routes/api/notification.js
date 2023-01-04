const router = require("express").Router();
const { requireSignin } = require("../../middleware/index.js");
const Notification = require("../../models/notification");
const mongoose = require("mongoose");
const { Types } = mongoose;
const { ObjectId } = Types;

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

router.post("/unSeen-all", requireSignin, async (req, res) => {
  try {
    const _id = req.user._id;
    await Notification.updateMany(
      {
        userRelative: _id,
        userSeen: {
          $ne: _id,
        },
      },
      {
        $push: {
          userSeen: _id,
        },
      }
    );
    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
      error,
    });
  }
});

router.post("/unSeen", requireSignin, async (req, res) => {
  try {
    const _id = req.user._id;
    const notificationId = req.body.notificationId;
    await Notification.updateOne(
      {
        _id: notificationId,
      },
      {
        $push: {
          userSeen: _id,
        },
      }
    );
    return res.status(200).json({
      success: true,
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
      .sort({ updatedAt: -1 })
      .populate("post")
      .populate("comment.replyTo comment.newComment")
      .populate({
        path: "friend",
        populate: "requester recipient",
      })
      .exec();

    const notiRes = notifications.map((notification) => {
      return {
        ...notification._doc,
        isSeen: notification.userSeen.includes(ObjectId(_id)),
      };
    });

    return res.status(200).json({
      success: true,
      notifications: notiRes,
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
