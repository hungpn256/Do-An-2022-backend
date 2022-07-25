const router = require("express").Router();

const { requireSignin, checkLogin } = require("../../middleware/index.js");

const User = require("../../models/user.js");
const keys = require("../../config/keys.js");

router.get("/profile", requireSignin, async (req, res) => {
  const user = req.user;
  User.findById(user._id).exec((err, _user) => {
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
          name: {
            firstName: _user.firstName,
            lastName: _user.lastName,
          },
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

router.get("/recomment", requireSignin, async (req, res) => {
  const userId = req.user._id;

  try {
    const currentUser = await User.findById(userId);
    const userFollow = currentUser.follow;
    let suggestedUsers = await User.find({
      $and: [{ _id: { $ne: userId } }, { _id: { $nin: userFollow } }],
    }).limit(5);
    suggestedUsers = suggestedUsers.map((v) => {
      return {
        _id: v._id,
        name: {
          firstName: v.firstName,
          lastName: v.lastName,
        },
        avatar: v.avatar,
      };
    });
    return res.status(200).json(suggestedUsers);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Your request could not be processed. Please try again.",
    });
  }
});

router.put("/follow/:userId", requireSignin, async (req, res) => {
  const _id = req.user._id;
  const _userId = req.params.userId;

  await User.findById(_id).exec((err, user) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: "Your request could not be processed. Please try again.",
      });
    }
    if (user.follow.length > 0 && user.follow.includes(_userId)) {
      const filtered = user.follow.filter(function (value, index, arr) {
        return value != _userId;
      });
      user.follow = filtered;
      user.save();
      return res.status(200).json({
        success: true,
        message: "Unfollow successfully.",
      });
    } else {
      user.follow = [...user.follow, _userId];
      user.save();
      return res.status(200).json({
        success: true,
        message: "Follow successfully.",
      });
    }
  });
});

router.get("/:id", checkLogin, async (req, res) => {
  const id = req.params.id;
  const userId = req.user._id;
  let check = 3;
  if (req.user !== 3) {
    if (userId === id) {
      check = 0;
    } else {
      const currentUser = await User.findById(userId).catch((err) =>
        console.log(err)
      );

      if (currentUser.follow.includes(id)) {
        check = 1;
      } else {
        check = 2;
      }
    }
  }

  User.findById(id).exec((err, _user) => {
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
          name: {
            firstName: _user.firstName,
            lastName: _user.lastName,
          },
          location: _user.location,
          relation: _user.relation,
          avatar: _user.avatar,
          cover: _user.cover,
          gender: _user.gender,
          role: _user.role,
        },
        isFollowed: check,
      });
    }
  });
});

router.put("/profile", requireSignin, async (req, res) => {
  const user = req.user;
  const update = req.body;
  const query = user._id;
  try {
    const updateTime = Date.now();
    update.update = updateTime;
    const _user = await User.findByIdAndUpdate(query, update, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: "Your profile is successfully updated!",
      user: {
        _id: _user._id,
        email: _user.email,
        phoneNumber: _user.phoneNumber,
        name: {
          firstName: _user.firstName,
          lastName: _user.lastName,
        },
        location: _user.location,
        relation: _user.relation,
        avatar: _user.avatar,
        cover: _user.cover,
        gender: _user.gender,
        role: _user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Your request could not be processed. Please try again.",
    });
  }
});

module.exports = router;
