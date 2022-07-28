const router = require("express").Router();

const authRoutes = require("./auth.js");
const userRoutes = require("./user.js");
const postRoutes = require("./post.js");
const friendRoutes = require("./friend");
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

router.get("/search", async (req, res) => {
  let q = req.query.q;
  let result = {};
  const qUser = queryVarUser(removeAccents(q));
  console.log(qUser);
  await User.find(qUser)
    .then((users) => {
      const _users = users.map((v) => {
        return {
          _id: v._id,
          name: {
            firstName: v.firstName,
            lastName: v.lastName,
          },
          avatar: v.avatar,
        };
      });
      result.users = _users;
    })
    .catch((err) => {
      return res.status(400).json({
        success: false,
        message: "Your request could not be processed. Please try again.",
      });
    });

  const qPost = queryVarPost(removeAccents(q));
  console.log(qPost);
  await Post.find(qPost)
    .populate("createBy", "firstName lastName avatar")
    .then((posts) => {
      const _posts = posts.map((post) => {
        return {
          createBy: {
            avatar: post.createBy.avatar,
            name: {
              firstName: post.createBy.firstName,
              lastName: post.createBy.lastName,
            },
            _id: post.createBy._id,
          },
          _id: post._id,
          images: post.images,
          liked: post.liked,
          text: post.text,
          numOfCmt: post.numOfCmt,
          createAt: post.createAt,
          updateAt: post.updateAt,
          action: post.action,
        };
      });
      result.articles = _posts;
    })
    .catch((err) => {
      return res.status(400).json({
        success: false,
        message: "Your request could not be processed. Please try again.",
      });
    });

  return res.status(200).json({
    result,
  });
});
module.exports = router;
