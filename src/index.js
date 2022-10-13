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

app.use(morgan("dev"));
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
  });

  socket.on(
    "call-conversation",
    async ({ conversationId, signalData, from }) => {
      const user = await User.findById(from);
      const conversation = await Conversation.findById(conversationId);
      if (!user || !conversation) return;
      const usersToCall = conversation.participants
        .map((i) => i.user)
        .filter((user) => user.toString() !== user.from);
      const listSocketFriend = await SocketModel.find({
        user: {
          $in: usersToCall,
        },
        socket: {
          $ne: socket.id,
        },
      });

      listSocketFriend.forEach((item) => {
        socket
          .to(item.socket)
          .emit("call-conversation", { signal: signalData, from: user });
      });
    }
  );

  socket.on("answerCall", (data) => {
    io.to(data.to).emit("callAccepted", data.signal);
  });
});

server.listen(port, () => {
  console.log(
    `${chalk.green("✓")} ${chalk.blue(
      `Listening on port ${port}. Visit http://localhost:${port}/ in your browser.`
    )}`
  );
});
