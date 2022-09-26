const router = require("express").Router();

const authRoutes = require("./auth.js");
const userRoutes = require("./user.js");
const postRoutes = require("./post.js");
const friendRoutes = require("./friend");
const conversationRoutes = require("./conversation");
const notificationRoutes = require("./notification");
const { queryVarUser, queryVarPost } = require("../../services/query.js");
const User = require("../../models/user.js");
const Post = require("../../models/post.js");
const { removeAccents } = require("../../helps/removeAccent.js");

// auth routes
router.use("/auth", authRoutes);

// user routes
router.use("/user", userRoutes);

// post routes
router.use("/post", postRoutes);

//friend routes
router.use("/friend", friendRoutes);

//conversation routes
router.use("/conversation", conversationRoutes);

//notifications routes
router.use("/notification", notificationRoutes);

router.get("/search", async (req, res) => {
  let q = req.query.q;
  let result = {};
  const qUser = queryVarUser(removeAccents(q));
  const users = await User.find(qUser);
  result.users = users;
  const qPost = queryVarPost(removeAccents(q));
  const posts = await Post.find(qPost);
  result.articles = posts;
  return res.status(200).json({
    result,
  });
});
module.exports = router;
