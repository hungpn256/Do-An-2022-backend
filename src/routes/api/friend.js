const router = require("express").Router();
const { requireSignin } = require("../../middleware/index.js");
const User = require("../../models/user.js");
const Friend = require("../../models/friend");

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
        user1.save();
        user2.friend.push(_id);
        user2.save();
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
        checkExist.remove();
      }
      return res.status(200).json({
        success: true,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Could not find friend",
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

router.get("/byStatus", requireSignin, async (req, res) => {
  try {
    console.log(123);
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
    console.log("🚀 ~ file: friend.js ~ line 167 ~ router.get ~ error", error);
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
    const user = await User.findById(_id).populate({
      path: "friend",
      model: "User",
    });
    console.log("🚀 ~ file: friend.js ~ line 180 ~ user ~ user", user.friend);
    if (user) {
      return res.status(200).json({
        success: true,
        friends: user.friend,
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
