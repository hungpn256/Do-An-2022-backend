const Like = require("../models/like");
const Comment = require("../models/comment");
const Post = require("../models/post");
const Notification = require("../models/notification");
const SocketModel = require("../models/socket");
const createNotifications = async (res, notification, userId) => {
  let usersNoti = [];

  const notificationExist = await Notification.findOne({
    type: notification.type,
    post: notification.post,
    comment: notification.comment,
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
    usersNoti = [_post.createdBy._id.toString()];
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
    ]);

    usersNoti = Array.from(userSet).filter((i) => i !== userId);
  }

  _notification.userRelative = usersNoti;
  _notification.userSeen = [];
  const notificationSave = await _notification.save();
  const notificaitonRes = await Notification.populate(notificationSave, [
    { path: "post" },
    { path: "comment" },
    {
      path: "userRelative",
      select: {
        _id: 1,
        fullName: 1,
        avatar: 1,
      },
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
