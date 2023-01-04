const Like = require("../models/like");
const Comment = require("../models/comment");
const Post = require("../models/post");
const Notification = require("../models/notification");
const SocketModel = require("../models/socket");
const mongoose = require("mongoose");
const { Types } = mongoose;
const { ObjectId } = Types;

const createNotifications = async (res, notification, userId) => {
  let usersNoti = [];

  const notificationExist = await Notification.findOne({
    type: notification.type,
    post: notification.post,
    "comment.replyTo": notification.comment?.replyTo,
  });

  let _notification = new Notification(notification);

  if (notificationExist) {
    Object.keys(notification).forEach((i) => {
      notificationExist[i] = notification[i];
    });
    _notification = notificationExist;
  }

  if (_notification.type === "LIKE_POST") {
    const _post = await Post.findOne({ _id: notification.post });
    usersNoti = [
      _post.createdBy._id.toString(),
      ..._post.notificationTo.map((i) => i.toString()),
    ].filter(
      (i) => i !== userId && !_post.notificationOff.includes(ObjectId(i))
    );
  } else if (_notification.type === "COMMENT_POST") {
    const _post = await Post.findOne({ _id: notification.post });
    const userSet = new Set([
      ...(
        await Comment.find({
          _id: {
            $in: _post.comment,
          },
        }).distinct("createdBy")
      ).map((i) => i.toString()),
      _post.createdBy._id.toString(),
      ..._post.notificationTo.map((i) => i.toString()),
    ]);

    usersNoti = Array.from(userSet).filter(
      (i) => i !== userId && !_post.notificationOff.includes(ObjectId(i))
    );
  } else if (_notification.type === "REPLY_COMMENT") {
    const commentReply = await Comment.findById(notification.comment.replyTo);
    usersNoti = [commentReply.createdBy._id.toString()];
  } else if (_notification.type === "FRIEND") {
    const friend = notification.friend;
    if (friend.status === "PENDING") {
      usersNoti = [friend.recipient._id.toString()];
    } else {
      usersNoti = [friend.requester._id.toString()];
    }
  }

  _notification.userRelative = usersNoti;
  _notification.userSeen = [];
  const notificationSave = await _notification.save();
  const notificaitonRes = await Notification.populate(notificationSave, [
    { path: "post" },
    { path: "comment.replyTo comment.newComment" },
    {
      path: "userRelative",
      select: {
        _id: 1,
        fullName: 1,
        avatar: 1,
      },
    },
    {
      path: "friend",
      populate: [{ path: "requester" }, { path: "recipient" }],
    },
  ]);

  const io = res.app.get("socketio");
  const listSocket = await SocketModel.find({
    user: {
      $in: usersNoti,
    },
  });

  listSocket.forEach((item) => {
    io.to(item.socket).emit("new-notification", notificaitonRes);
  });
  return notificaitonRes;
};

module.exports.createNotifications = createNotifications;
