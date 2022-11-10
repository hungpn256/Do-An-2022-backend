const router = require("express").Router();
const Post = require("../../models/post.js");
const User = require("../../models/user.js");
const Comment = require("../../models/comment.js");
const Notification = require("../../models/notification.js");
const Like = require("../../models/like.js");
const mongoose = require("mongoose");
const { Types } = mongoose;
const { ObjectId } = Types;
const { requireSignin } = require("../../middleware/index.js");
const { createNotifications } = require("../../services/notification.js");

router.post("/create", requireSignin, async (req, res) => {
  const user = req.user;
  const { text, files, action } = req.body;

  const post = {
    text,
    createdBy: user._id,
    files: files,
    action,
    comment: [],
    liked: [],
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

    const newPost = await Post.findOne({ _id: _post._id });

    return res.status(200).json({
      success: true,
      message: "Create post successfully.",
      post: newPost,
    });
  });
});

router.post("/on-notification", requireSignin, async (req, res) => {
  const user = req.user;
  const { postId } = req.body;

  try {
    await Post.updateOne(
      { _id: postId },
      {
        $addToSet: {
          notificationTo: user._id,
        },
        $pull: {
          notificationOff: user._id,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Turn on notification successfully.",
    });
  } catch (err) {
    return res.status(400).json({
      error: "Your request could not be processed. Please try again.",
    });
  }
});

router.post("/off-notification", requireSignin, async (req, res) => {
  const user = req.user;
  const { postId } = req.body;

  try {
    await Post.updateOne(
      { _id: postId },
      {
        $addToSet: {
          notificationOff: user._id,
        },
        $pull: {
          notificationTo: user._id,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Turn off notification successfully.",
    });
  } catch (err) {
    return res.status(400).json({
      error: "Your request could not be processed. Please try again.",
    });
  }
});

router.put("/:id/text", requireSignin, async (req, res) => {
  const user = req.user._id;
  const id = req.params.id;
  const query = {
    _id: id,
    createdBy: user,
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

router.delete("/comment/:id", requireSignin, async (req, res) => {
  const id = req.params.id;
  try {
    await Comment.findByIdAndDelete(id);
    await Notification.deleteMany({ "comment.replyTo": id });
    return res.status(200).json({
      success: true,
      message: "Delete comment successfully.",
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: `You can't delete this comment.`,
      error: e.message,
    });
  }
});

router.put("/comment/:id", requireSignin, async (req, res) => {
  const id = req.params.id;
  const content = req.body.content;
  try {
    const commentUpdated = await Comment.findByIdAndUpdate(
      id,
      { content },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: "Update comment successfully.",
      comment: commentUpdated,
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: `You can't update this comment.`,
      error: e.message,
    });
  }
});

router.delete("/:id", requireSignin, async (req, res) => {
  const user = req.user._id;
  const id = req.params.id;
  const query = {
    _id: id,
    createdBy: user,
  };
  const update = req.body;

  Post.findOneAndDelete(query, update).exec(async (err, _post) => {
    if (err)
      return res.status(400).json({
        error: "Your request could not be processed. Please try again.",
      });

    if (!_post)
      return res.status(400).json({
        success: false,
        message: `You can't delete this post.`,
      });
    await Notification.deleteMany({ post: _post._id });
    return res.status(200).json({
      success: true,
      message: "Delete post successfully.",
      post: _post,
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

    const _post = await Post.findOne(query);
    if (!_post)
      return res.status(400).json({
        success: false,
        message: `You can't comment this post.`,
      });
    const _comment = new Comment({ ...req.body.comment, createdBy: userId });
    const commentSave = await _comment.save();
    _post.comment.push(commentSave._id);
    await _post.save();
    const commentResponse = await Comment.findOne({
      _id: commentSave._id,
    }).populate("createdBy", "avatar fullName");
    await createNotifications(
      res,
      {
        type: "COMMENT_POST",
        post: _post._id,
      },
      userId
    );
    return res.status(200).json({
      success: true,
      message: "Comment post successfully.",
      comment: commentResponse,
    });
  } catch (err) {
    "🚀 ~ file: post.js ~ line 148 ~ router.post ~ err", err;
    return res.status(400).json({
      error: "Your request could not be processed. Please try again.",
    });
  }
});

router.post("/rep-comment/:id", requireSignin, async (req, res) => {
  try {
    const userId = req.user._id;
    const id = req.params.id;
    const query = {
      _id: id,
    };

    const _post = await Post.findOne({ comment: id });

    if (!_post) {
      return res.status(400).json({
        message: "post not found",
      });
    }

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
    const commentResponse = await Comment.findOne({
      _id: commentSave._id,
    }).populate("createdBy");

    await createNotifications(
      res,
      {
        type: "REPLY_COMMENT",
        post: _post._id,
        comment: {
          newComment: commentResponse._id,
          replyTo: _comment._id,
        },
      },
      userId
    );

    return res.status(200).json({
      success: true,
      message: "Rep comment successfully.",
      comment: commentResponse,
    });
  } catch (err) {
    return res.status(400).json({
      message: "Your request could not be processed. Please try again.",
      error: err,
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
        $in: _post.liked,
      },
      likedBy: userId,
    });
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
    const _postResponse = await Post.findOne(query)
      .populate({
        path: "comment",
        populate: {
          path: "createdBy",
          model: "User",
          path: "reply",
          model: "Comment",
        },
      })
      .populate({
        path: "liked",
        populate: {
          path: "createdBy",
          model: "User",
        },
      });
    if (
      !(
        likedByCurrentUser &&
        likedByCurrentUser.type === likeReq.type &&
        _post.createdBy._id.toString() !== userId
      )
    ) {
      await createNotifications(
        res,
        {
          type: "LIKE_POST",
          post: _post._id,
        },
        userId
      );
    }
    return res.status(200).json({
      success: true,
      message: "Like post successfully.",
      post: _postResponse,
    });
  } catch (error) {
    return res.status(400).json({
      message: "Your request could not be processed. Please try again.",
      error: error.message,
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
        $in: _comment.liked,
      },
      likedBy: userId,
    });
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
    const _commentResponse = await Comment.findOne(query);
    return res.status(200).json({
      success: true,
      message: "Like post successfully.",
      post: _commentResponse,
    });
  } catch (error) {
    return res.status(400).json({
      message: "Your request could not be processed. Please try again.",
      error,
    });
  }
});

router.get("/comment/:idPost", requireSignin, async (req, res) => {
  const { idPost } = req.params;
  const post = await Post.findOne({ _id: idPost });
  if (!post) {
    return res.status(400).json({
      message: "Post not found",
    });
  }
  return res.status(200).json({
    message: "Get comment successfully",
    comment: post.comment,
  });
});

router.get("/photos", requireSignin, async (req, res) => {
  try {
    const userId = req.query.userId;
    const post = await Post.find({ createdBy: userId }).distinct("files");
    if (!post) {
      return res.status(400).json({
        message: "Post not found",
      });
    }
    return res.status(200).json({
      message: "Get comment successfully",
      files: post,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
});

router.get("/:userId", requireSignin, async (req, res) => {
  const userId = req.params.userId;
  const limit = req.query.limit || 10;
  const _id = req.query._id;

  const query = { _id: { $lt: _id }, createdBy: userId };
  if (!_id) {
    delete query._id;
  }
  const count = await Post.countDocuments();

  Post.find(query)
    .sort({ createdAt: "desc" })
    .limit(Number(limit))
    .exec(async (err, posts) => {
      if (err) {
        return res.status(400).json({
          error: err,
        });
      }

      const _posts = await posts.map((post) => {
        return {
          createdBy: {
            avatar: post.createdBy.avatar,
            fullName: post.createdBy.fullName,
            _id: post.createdBy._id,
          },
          _id: post._id,
          files: post.files,
          liked: post.liked,
          text: post.text,
          createdAt: post.createdAt,
          updateAt: post.updateAt,
          action: post.action,
          numOfCmt: post.comment.length,
          comment: post.comment.splice(-1, 1),
        };
      });

      return res.status(200).json({
        success: true,
        posts: _posts,
        totalPost: count,
      });
    });
});

router.get("/detail/:id", requireSignin, async (req, res) => {
  const id = req.params.id;

  Post.findById(id).exec(async (err, post) => {
    if (err) {
      return res.status(400).json({
        error: err,
      });
    }

    const _post = {
      createdBy: {
        avatar: post.createdBy.avatar,
        fullName: post.createdBy.fullName,
        _id: post.createdBy._id,
      },
      _id: post._id,
      files: post.files,
      liked: post.liked,
      text: post.text,
      createdAt: post.createdAt,
      updateAt: post.updateAt,
      action: post.action,
      numOfCmt: post.comment.length,
      comment: post.comment.splice(-1, 1),
    };

    return res.status(200).json({
      success: true,
      post: _post,
    });
  });
});

router.get("/", requireSignin, async (req, res) => {
  const limit = req.query.limit || 10;
  const _id = req.query._id;
  const query = { _id: { $lt: _id } };
  if (!_id) {
    delete query._id;
  }
  const count = await Post.countDocuments();

  Post.find(query)
    .sort({ createdAt: "desc" })
    .limit(Number(limit))
    .exec(async (err, posts) => {
      if (err) {
        return res.status(400).json({
          error: err,
        });
      }

      const _posts = await posts.map((post) => {
        return {
          createdBy: {
            avatar: post.createdBy.avatar,
            fullName: post.createdBy.fullName,
            _id: post.createdBy._id,
          },
          _id: post._id,
          files: post.files,
          liked: post.liked,
          text: post.text,
          createdAt: post.createdAt,
          updateAt: post.updateAt,
          action: post.action,
          numOfCmt: post.comment.length,
          comment: post.comment.splice(-1, 1),
        };
      });

      return res.status(200).json({
        success: true,
        posts: _posts,
        totalPost: count,
      });
    });
});

module.exports = router;
