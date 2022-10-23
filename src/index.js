require("dotenv").config();
const chalk = require("chalk");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("passport");
const path = require("path");
const morgan = require("morgan");
const keys = require("./config/keys");
const { database, port } = keys;
const routes = require("./routes/index.js");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const jwt = require("jsonwebtoken");
const User = require("./models/user");
const Post = require("./models/post");
const SocketModel = require("./models/socket");
const Conversation = require("./models/conversation");
const Call = require("./models/call");

// app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(passport.initialize());
app.use("/public", express.static(path.join(__dirname, "uploads")));
// Connect to MongoDB
mongoose
  .connect(database.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    await SocketModel.deleteMany();
    await Call.deleteMany();
    await User.updateMany({ status: "ONLINE" }, { status: "OFFLINE" });
    // await Post.updateMany(
    //   {},
    //   {
    //     $set: {
    //       notificationTo: [],
    //       notificationOff: [],
    //     },
    //   }
    // );
    console.log(`${chalk.green("✓")} ${chalk.blue("MongoDB Connected!")}`);
  })
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Hello world!!");
});

app.use("/api/v1", routes);

io.use((socket, next) => {
  if (socket.handshake.auth.token) {
    const token = socket.handshake.auth.token.split(" ")[1];
    const user = jwt.verify(token, keys.jwt.secret);
    socket.user = user;
    next();
  }
});

app.set("socketio", io);
io.on("connection", async (socket) => {
  const { user } = socket;
  const newSocket = {
    socket: socket.id,
    user: user._id,
  };
  await new SocketModel(newSocket).save();
  await User.findOneAndUpdate(
    { _id: user._id },
    { status: "ONLINE", lastLogin: new Date() }
  );
  const userCurrent = await User.findOne({ _id: user._id });
  const listSocketFriend = await SocketModel.find({
    user: {
      $in: userCurrent.friend,
    },
  });
  listSocketFriend.forEach((item) => {
    socket.to(item.socket).emit("friend-status-change", item.user);
  });

  socket.on("disconnect", async () => {
    console.log("disconnect");
    await SocketModel.findOneAndDelete({ socket: socket.id });
    const checkSokerExist = await SocketModel.findOne({ user: user._id });
    if (!checkSokerExist) {
      await User.findOneAndUpdate({ _id: user._id }, { status: "OFFLINE" });
    }
    const userCurrent = await User.findOne({ _id: user._id });
    const listSocketFriend = await SocketModel.find({
      user: {
        $in: userCurrent.friend,
      },
    });
    listSocketFriend.forEach((item) => {
      socket.to(item.socket).emit("friend-status-change", item.user);
    });

    //handle callEnd
    const call = await Call.findOne({
      "participants.socket": socket.id,
      endAt: null,
    });
    if (call) {
      call.participants.splice(
        call.participants.findIndex((i) => i.socket === socket.id),
        1
      );
      if (call.participants.length < 2) {
        call.endAt = Date.now();
        socket.broadcast.to(call._id.toString()).emit("call-end");
      }
      await call.save();
    }
  });

  socket.on("join", async ({ signal, callId }) => {
    try {
      const userId = socket.user._id;
      let callCurrent = await Call.findById(callId);

      callCurrent.participants.push({
        user: userId,
        signal,
        socket: socket.id,
      });
      await callCurrent.save();

      const newCall = await Call.findOne(callCurrent)
        .populate({
          path: "participants.user",
          select: {
            avatar: 1,
            fullName: 1,
            status: 1,
          },
        })
        .populate("conversation")
        .populate("createdBy");

      socket.join(callId);
      if (callCurrent.participants.length > 1) {
        socket.broadcast.to(callId).emit("user-join-call", {
          call: newCall,
        });
      } else {
        const conversation = await Conversation.findById(
          callCurrent.conversation
        );

        const usersToCall = conversation.participants
          .map((i) => i.user)
          .filter((user) => user.toString() !== userId);
        const listSocketFriend = await SocketModel.find({
          user: {
            $in: usersToCall,
          },
        });

        listSocketFriend.forEach((item) => {
          socket.to(item.socket).emit("call-conversation", newCall);
        });
      }
    } catch (e) {
      console.log("eeeeeeeeeeeeeeeee", e.message);
    }
  });
});

server.listen(port, () => {
  console.log(
    `${chalk.green("✓")} ${chalk.blue(
      `Listening on port ${port}. Visit http://localhost:${port}/ in your browser.`
    )}`
  );
});
