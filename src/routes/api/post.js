const router = require("express").Router();
const Post = require("../../models/post.js");
const User = require("../../models/user.js");
const Comment = require("../../models/comment.js");
const Like = require("../../models/like.js");

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

    return res.status(200).json({
      success: true,
      message: "Create post successfully.",
      post: {
        createBy: {
          avatar: post.createBy.avatar,
          fullName: post.createBy.fullName,
          _id: post.createBy._id,
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
            fullName: post.createBy.fullName,
            _id: post.createBy._id,
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

router.get("/:userId", async (req, res) => {
  const userId = req.params.userId;
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;

  await Post.find({ createBy: userId }, {})
    .sort({ createAt: "desc" })
    .skip((Number(page) - 1) * +limit)
    .limit(Number(limit))
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
            fullName: post.createBy.fullName,
            _id: post.createBy._id,
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
  try {
    const userId = req.user._id;
    const id = req.params.id;
    const query = {
      _id: id,
    };

    const _post = await Post.find(query);
    if (!_post.length)
      return res.status(400).json({
        success: false,
        message: `You can't comment this post.`,
      });
    const _comment = new Comment({ ...req.body.comment, createdBy: userId });
    const commentSave = await _comment.save();
    _post[0].comment.push(commentSave._id);
    await _post[0].save();
    const commentResponse = await
      Comment
        .findOne({ _id: commentSave._id })
        .populate("createdBy", "avatar fullName")
    return res.status(200).json({
      success: true,
      message: "Comment post successfully.",
      comment: commentResponse,
    });
  } catch (err) {
    return res.status(400).json({
      error: "Your request could not be processed. Please try again.",
    });
  }
});

router.post("/rep-comment/:id", requireSignin, async (req, res) => {
  try {
    const userId = req.user._id;
    const id = req.params.id;
    const postId = req.params.postId
    const query = {
      _id: id,
    };

    const _comment = await Comment.findOne(query);
    if (!_comment)
      return res.status(400).json({
        success: false,
        message: `Comment unavailable`,
      });
    const _newComment = new Comment({ ...req.body.comment, createdBy: userId });
    const commentSave = await _newComment.save();
    _comment.reply.push(commentSave._id);
    await _comment.save();
    const commentResponse = await
      Comment
        .findOne({ _id: commentSave._id })
        .populate("createdBy")
    return res.status(200).json({
      success: true,
      message: "Comment post successfully.",
      comment: commentResponse,
    });
  } catch (err) {
    return res.status(400).json({
      message: "Your request could not be processed. Please try again.",
      error: err
    });
  }
});

router.post("/like/:id", requireSignin, async (req, res) => {
  try {
    const userId = req.user._id;
    const id = req.params.id;
    const query = {
      _id: id,
    };
    const likeReq = req.body.like;

    const _post = await Post.findOne(query);
    if (!_post)
      return res.status(400).json({
        success: false,
        message: `You can't comment this post.`,
      });
    const likedByCurrentUser = await Like.findOne({
      _id: {
        $in: _post.liked
      },
      likedBy: userId,
    })
    if (likedByCurrentUser && likedByCurrentUser.type === likeReq.type) {
      _post.liked.splice(_post.liked.indexOf(likedByCurrentUser.id), 1);
      likedByCurrentUser.delete();
    } else if (likedByCurrentUser && likedByCurrentUser.type !== likeReq.type) {
      likedByCurrentUser.type === likeReq.type;
      await likedByCurrentUser.update({ type: likeReq.type });
    } else {
      const _liked = new Like({ ...likeReq, likedBy: userId });
      const likeSave = await _liked.save();
      _post.liked.push(likeSave._id);
    }
    await _post.save();
    const _postResponse = await Post.findOne(query).populate({
      path: "comment",
      populate: {
        path: "createdBy",
        model: "User",
        path: "reply",
        model: "Comment",
      },
    }).populate({
      path: "liked",
      populate: {
        path: "createdBy",
        model: "User",
      },
    });
    return res.status(200).json({
      success: true,
      message: "Like post successfully.",
      post: _postResponse,
    });
  } catch (error) {
    return res.status(400).json({
      message: "Your request could not be processed. Please try again.",
      error
    });
  }
});

router.post("/like-comment/:id", requireSignin, async (req, res) => {
  try {
    const userId = req.user._id;
    const id = req.params.id;
    const query = {
      _id: id,
    };
    const likeReq = req.body.like;

    const _comment = await Comment.findOne(query);
    if (!_comment)
      return res.status(400).json({
        success: false,
        message: `You can't comment this comment.`,
      });
    const likedByCurrentUser = await Like.findOne({
      _id: {
        $in: _comment.liked
      },
      likedBy: userId,
    })
    if (likedByCurrentUser && likedByCurrentUser.type === likeReq.type) {
      _comment.liked.splice(_comment.liked.indexOf(likedByCurrentUser.id), 1);
      likedByCurrentUser.delete();
    } else if (likedByCurrentUser && likedByCurrentUser.type !== likeReq.type) {
      likedByCurrentUser.type === likeReq.type;
      await likedByCurrentUser.update({ type: likeReq.type });
    } else {
      const _liked = new Like({ ...likeReq, likedBy: userId });
      const likeSave = await _liked.save();
      _comment.liked.push(likeSave._id);
    }
    await _comment.save();
    const _commentResponse = await Comment.findOne(query)
    return res.status(200).json({
      success: true,
      message: "Like post successfully.",
      post: _commentResponse,
    });
  } catch (error) {
    return res.status(400).json({
      message: "Your request could not be processed. Please try again.",
      error
    });
  }
});

module.exports = router;
