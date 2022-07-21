const router = require("express").Router();
const Post = require("../../models/post.js");
const User = require("../../models/user.js");
const Comment = require("../../models/comment.js");

const { requireSignin } = require("../../middleware/index.js");
const { removeAccents } = require("../../helps/removeAccent.js");

router.post("/create", requireSignin, async (req, res) => {
  const user = req.user;
  const { text, images, action } = req.body;

  const post = {
    text,
    textAccent: text ? removeAccents(text).toLowerCase() : null,
    createBy: user._id,
    images: images,
    action,
  };

  const newPost = new Post(post);
  await newPost.save(async (err, _post) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: "Your request could not be processed. Please try again.",
      });
    }
    if (!_post) {
      return res.status(400).json({
        success: false,
        message: "You can't save post.",
      });
    }
    let _user = await User.findById(user._id);
    _user.password = null;

    return res.status(200).json({
      success: true,
      message: "Create post successfully.",
      post: {
        createBy: {
          avatar: _user.avatar,
          name: {
            firstName: _user.firstName,
            lastName: _user.lastName,
          },
          _id: _user._id,
          phoneNumber: _user.phoneNumber,
          gender: _user.gender,
          role: _user.role,
        },
        _id: _post._id,
        images: _post.images,
        liked: _post.liked,
        text: _post.text,
        createAt: _post.createAt,
        updateAt: _post.updateAt,
        action: _post.action,
      },
    });
  });
});

router.put("/:id/text", requireSignin, async (req, res) => {
  const user = req.user._id;
  const id = req.params.id;
  const query = {
    _id: id,
    createBy: user,
  };

  const update = {
    text: req.body.text,
  };

  await Post.findOneAndUpdate(query, update, { new: true }).exec(
    (err, _post) => {
      if (err)
        return res.status(400).json({
          error: "Your request could not be processed. Please try again.",
        });

      if (!_post)
        return res.status(400).json({
          success: false,
          message: `You can't update this post.`,
        });

      return res.status(200).json({
        success: true,
        message: "Update post successfully.",
        post: _post,
      });
    }
  );
});

router.delete("/:id", requireSignin, async (req, res) => {
  const user = req.user._id;
  const id = req.params.id;
  const query = {
    _id: id,
    createBy: user,
  };
  const update = req.body;

  await Post.findOneAndDelete(query, update).exec((err, _post) => {
    if (err)
      return res.status(400).json({
        error: "Your request could not be processed. Please try again.",
      });

    if (!_post)
      return res.status(400).json({
        success: false,
        message: `You can't delete this post.`,
      });

    return res.status(200).json({
      success: true,
      message: "Delete post successfully.",
      post: _post,
    });
  });
});

router.get("/", async (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 100;

  await Post.find()
    .sort({ createAt: "desc" })
    .skip((Number(page) - 1) * +limit)
    .limit(Number(limit))
    .populate("createBy")
    .populate({
      path: "comment",
      populate: {
        path: "createdBy",
        model: "User",
      },
    })
    .exec(async (err, posts) => {
      if (err) {
        return res.status(400).json({
          error: err,
        });
      }

      const _posts = await posts.map((post) => {
        return {
          createBy: {
            avatar: post.createBy.avatar,
            name: {
              firstName: post.createBy.firstName,
              lastName: post.createBy.lastName,
            },
            _id: post.createBy._id,
            phoneNumber: post.createBy.phoneNumber,
            gender: post.createBy.gender,
            role: post.createBy.role,
          },
          _id: post._id,
          images: post.images,
          liked: post.liked,
          text: post.text,
          createAt: post.createAt,
          updateAt: post.updateAt,
          action: post.action,
          comment: post.comment.splice(0, 1),
        };
      });

      return res.status(200).json({
        success: true,
        posts: _posts,
      });
    });
});

router.get("/:userId", async (req, res) => {
  const userId = req.params.userId;
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;

  await Post.find({ createBy: userId }, {})
    .sort({ createAt: "desc" })
    .skip((Number(page) - 1) * +limit)
    .limit(Number(limit))
    .populate("createBy")
    .populate({
      path: "comment",
      populate: {
        path: "createdBy",
        model: "User",
      },
    })
    .exec(async (err, posts) => {
      if (err) {
        return res.status(400).json({
          error: err,
        });
      }

      const _posts = await posts.map((post) => {
        return {
          createBy: {
            avatar: post.createBy.avatar,
            name: {
              firstName: post.createBy.firstName,
              lastName: post.createBy.lastName,
            },
            _id: post.createBy._id,
            phoneNumber: post.createBy.phoneNumber,
            gender: post.createBy.gender,
            role: post.createBy.role,
          },
          _id: post._id,
          images: post.images,
          liked: post.liked,
          text: post.text,
          createAt: post.createAt,
          updateAt: post.updateAt,
          action: post.action,
          numOfCmt: post.comment.length,
          comment: post.comment.splice(-1, 1),
        };
      });

      return res.status(200).json({
        success: true,
        posts: _posts,
      });
    });
});

router.post("/comment/:id", requireSignin, async (req, res) => {
  console.log(12);
  try {
    const userId = req.user._id;
    const id = req.params.id;
    console.log("🚀 ~ file: post.js ~ line 228 ~ router.post ~ id", id);
    const query = {
      _id: id,
    };

    const _post = await Post.find(query);
    console.log("🚀 ~ file: post.js ~ line 233 ~ router.post ~ _post", _post);
    if (!_post.length)
      return res.status(400).json({
        success: false,
        message: `You can't comment this post.`,
      });
    const _comment = new Comment({ ...req.body.comment, createdBy: userId });
    const commentSave = await _comment.save();
    _post[0].comment.push(commentSave._id);
    await _post[0].save();
    return res.status(200).json({
      success: true,
      message: "Comment post successfully.",
      post: _post[0],
    });
  } catch (err) {
    console.log("🚀 ~ file: post.js ~ line 251 ~ router.post ~ err", err);
    return res.status(400).json({
      error: "Your request could not be processed. Please try again.",
    });
  }
});

module.exports = router;
