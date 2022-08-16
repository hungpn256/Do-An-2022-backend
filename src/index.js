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

app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(passport.initialize());
app.use("/public", express.static(path.join(__dirname, "uploads")));
// Connect to MongoDB
mongoose.set("useCreateIndex", true);
mongoose
  .connect(database.url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() =>
    console.log(`${chalk.green("✓")} ${chalk.blue("MongoDB Connected!")}`)
  )
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Hello world!!");
});

app.use("/api/v1", routes);

// io.use((socket) => {
//   if (socket.handshake.auth.token) {
//     const token = socket.handshake.auth.token.split(" ")[1];
//     const user = jwt.verify(token, keys.jwt.secret);
//     req.user = user;
//   } else {
//     return res.status(401).json({ message: "Authorization required" });
//   }
//   next();
// });

io.on("connection", (socket) => {
  console.log("a user connected", socket);
  socket.on("disconnect", function () {
    console.log("disconect");
    console.log(socket);
  });
});

server.listen(port, () => {
  console.log(
    `${chalk.green("✓")} ${chalk.blue(
      `Listening on port ${port}. Visit http://localhost:${port}/ in your browser.`
    )}`
  );
});
