const router = require("express").Router();
const { requireSignin } = require("../../middleware/index.js");
const User = require("../../models/user.js");
const Friend = require("../../models/friend");
const { createNotifications } = require("../../services/notification.js");
const Notification = require("../../models/notification.js");

router.post("/:idUser", requireSignin, async (req, res) => {
  try {
    const _id = req.user._id;
    const _idTarget = req.params.idUser;
    const checkExist = await Friend.findOne({
      $or: [
        { requester: _id, recipient: _idTarget },
        { requester: _idTarget, recipient: _id },
      ],
      status: "PENDING",
    });
    if (checkExist) {
      return res.status(400).json({
        success: false,
        message: "exist",
      });
    }
    const _newFriend = new Friend({ requester: _id, recipient: _idTarget });
    await _newFriend.save();
    const _newFriendPopulated = await Friend.findOne(_newFriend).populate(
      "recipient requester"
    );
    await createNotifications(
      res,
      {
        type: "FRIEND",
        friend: _newFriendPopulated,
      },
      _id
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

router.get("relationship/:idUser", requireSignin, async (req, res) => {
  try {
    const _id = req.user._id;
    const _idTarget = req.params.idUser;
    const checkExist = await Friend.findOne({
      $or: [
        { requester: _id, recipient: _idTarget },
        { requester: _idTarget, recipient: _id },
      ],
    });
    return res.status(200).json({
      success: true,
      relationship: checkExist,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
      error,
    });
  }
});

router.put("/:idUser", requireSignin, async (req, res) => {
  try {
    const _id = req.user._id;
    const _idTarget = req.params.idUser;
    const status = req.body.status;
    const checkExist = await Friend.findOne({
      $or: [
        { requester: _id, recipient: _idTarget },
        { requester: _idTarget, recipient: _id },
      ],
    });
    if (checkExist) {
      checkExist.status = status;
      await checkExist.save();
      const user1 = await User.findOne({ _id });
      const user2 = await User.findOne({ _id: _idTarget });
      if (status === "ACCEPTED") {
        user1.friend.push(_idTarget);
        await user1.save();
        user2.friend.push(_id);
        await user2.save();
        const _friendPopulated = await Friend.findOne(checkExist).populate(
          "recipient requester"
        );
        await createNotifications(
          res,
          {
            type: "FRIEND",
            friend: _friendPopulated,
          },
          _id
        );
      } else if (status === "REJECTED") {
        if (user1.friend.includes(user2._id)) {
          await User.updateOne(
            { _id },
            {
              $pull: {
                friend: _idTarget,
              },
            }
          );
        }
        if (user2.friend.includes(user1._id)) {
          await User.updateOne(
            { _id: _idTarget },
            {
              $pull: {
                friend: _id,
              },
            }
          );
        }
        await Notification.deleteMany({
          friend: checkExist._id.toString(),
        });
        await checkExist.remove();
      }
      return res.status(200).json({
        success: true,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Could not find friend",
      });
    }
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
      error,
    });
  }
});

router.get("/byStatus", requireSignin, async (req, res) => {
  try {
    const _id = req.user._id;
    const status = req.query.status;
    if (status === "REQUESTED") {
      const friends = await Friend.find({
        requester: _id,
        status: "PENDING",
      }).populate({
        path: "recipient",
        model: "User",
      });
      return res.status(200).json({
        success: true,
        friends: friends,
      });
    }
    if (status === "PENDING") {
      const friends = await Friend.find({
        recipient: _id,
        status: "PENDING",
      }).populate({
        path: "requester",
        model: "User",
      });
      return res.status(200).json({
        success: true,
        friends: friends,
      });
    }
    return res.status(400).json({
      success: false,
      message: "User not found.",
      error,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
      error,
    });
  }
});

router.get("/:_id", requireSignin, async (req, res) => {
  try {
    const _id = req.params._id;
    const q = req.query.q;
    const allFriend = await User.findById(_id).distinct("friend");
    const query = {
      _id: {
        $in: allFriend,
      },
    };
    if (q) {
      query.fullName = new RegExp(q, "i");
    }
    const friendInSearch = await User.find(query).sort({
      lastLogin: -1,
    });
    if (friendInSearch) {
      return res.status(200).json({
        success: true,
        friends: friendInSearch,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "User not found.",
        error,
      });
    }
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
      error,
    });
  }
});

module.exports = router;
