const router = require("express").Router();

const { requireSignin, checkLogin } = require("../../middleware/index.js");

const User = require("../../models/user.js");
const keys = require("../../config/keys.js");
const Friend = require("../../models/friend");

router.get("/birthday", async (req, res) => {
  User.aggregate([
    {
      $redact: {
        $cond: [
          {
            $eq: [{ $month: "$birthday" }, { $month: new Date() }],
          },
        ],
      },
    },
  ]).exec(function (err, docs) {
    if (err) throw err;
  });
});

router.get("/profile", requireSignin, async (req, res) => {
  const user = req.user;
  User.findOne({ _id: user._id }).exec((err, _user) => {
    if (err)
      return res.status(500).json({
        success: false,
        error: "Your request could not be processed. Please try again.",
      });
    if (!_user)
      return res.status(401).json({
        success: false,
        message: "User doesn't exist.",
      });
    else {
      return res.status(200).json({
        success: true,
        user: {
          _id: _user._id,
          email: _user.email,
          phoneNumber: _user.phoneNumber,
          firstName: _user.firstName,
          lastName: _user.lastName,
          friends: _user.friends,
          avatar: _user.avatar,
          cover: _user.cover,
          gender: _user.gender,
          fullName: _user.fullName,
        },
      });
    }
  });
});

router.get("/:id", checkLogin, async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user?._id;
    const currentUser = await User.findById(userId);
    const userTarget = await User.findOne({ _id: id });

    if (!userTarget) {
      return res.status(400).json({
        success: false,
        error: "User not found",
      });
    }
    if (id !== userId) {
      let friendStatus;
      if (currentUser.friend.includes(userTarget._id)) {
        friendStatus = "FRIEND";
      } else {
        const reqFriend = await Friend.findOne({
          requester: userId,
          recipient: id,
          status: "PENDING",
        });
        const addFriend = await Friend.findOne({
          requester: id,
          recipient: userId,
          status: "PENDING",
        });
        if (reqFriend) {
          friendStatus = "REQUESTED";
        } else if (addFriend) {
          friendStatus = "PENDING";
        }
      }
      return res.status(200).json({
        success: true,
        user: userTarget,
        friendStatus,
      });
    } else {
      return res.status(200).json({
        success: true,
        user: currentUser,
        friendStatus: "MINE",
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Your request could not be processed. Please try again.",
    });
  }
});

router.put("/profile", requireSignin, async (req, res) => {
  const user = req.user;
  const update = req.body;
  const query = user._id;

  if (update.firstName !== undefined || update.lastName !== undefined) {
    update.fullName = `${update.firstName} ${update.lastName}`;
  }
  try {
    const _user = await User.findByIdAndUpdate(query, update, { new: true });

    res.status(200).json({
      success: true,
      message: "Your profile is successfully updated!",
      user: {
        _id: _user._id,
        email: _user.email,
        phoneNumber: _user.phoneNumber,
        firstName: _user.firstName,
        lastName: _user.lastName,
        avatar: _user.avatar,
        cover: _user.cover,
        gender: _user.gender,
        fullName: _user.fullName,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Your request could not be processed. Please try again.",
    });
  }
});

module.exports = router;
