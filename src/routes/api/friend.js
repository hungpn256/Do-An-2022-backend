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
    });
    if (checkExist) {
      return res.status(400).json({
        success: false,
        message: "Your request could not be processed. Please try again.",
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
      if (status === "ACCEPTED") {
        const user1 = await User.findOne({ _id });
        user1.friend.push(_idTarget);
        user1.save();
        const user2 = await User.findOne({ _id: _idTarget });
        user2.friend.push(_id);
        user2.save();
      } else if (status === "REJECTED") {
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

router.get("/", requireSignin, async (req, res) => {
  try {
    const _id = req.user._id;
    const user = await User.findById(_id).populate({
      path: "friend",
      model: "User",
      select: {
        _id: 1,
        avatar: 1,
        fullName: 1,
      },
    });
    if (user) {
      return res.status(200).json({
        success: true,
        friend: user.friend,
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

router.get("/byStatus", requireSignin, async (req, res) => {
  try {
    const _id = req.user._id;
    const status = req.params.status;
    if (status === "REQUESTED") {
      const friends = await Friend.find({
        requester: _id,
        status: "PENDING",
      }).populate({
        path: "recipient",
        model: "User",
        select: {
          _id: 1,
          avatar: 1,
          fullName: 1,
        },
      });
      return res.status(200).json({
        success: true,
        friends,
      });
    }
    if (status === "PENDING") {
      const friends = await Friend.find({
        recipient: _id,
        status: "PENDING",
      }).populate({
        path: "requester",
        model: "User",
        select: {
          _id: 1,
          avatar: 1,
          fullName: 1,
        },
      });
      return res.status(200).json({
        success: true,
        friends,
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

module.exports = router;
