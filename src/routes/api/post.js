const router = require('express').Router();
const Post = require('../../models/post.js');
const User = require('../../models/user.js');

const { requireSignin } = require('../../middleware/index.js');
const { removeAccents } = require('../../helps/removeAccent.js');

router.post('/create', requireSignin, async (req, res) => {
  const user = req.user;
  const { text, images, action } = req.body;

  const post = {
    text,
    textAccent: removeAccents(text).toLowerCase(),
    createBy: user._id,
    images: images,
    action,
  };

  const newPost = new Post(post);
  await newPost.save(async (err, _post) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message:
          'Your request could not be processed. Please try again.',
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
      message: 'Create post successfully.',
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
        numOfCmt: _post.numOfCmt,
        createAt: _post.createAt,
        updateAt: _post.updateAt,
        action: _post.action,
      },
    });
  });
});

router.put('/:id/text', requireSignin, async (req, res) => {
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
          error:
            'Your request could not be processed. Please try again.',
        });

      if (!_post)
        return res.status(400).json({
          success: false,
          message: `You can't update this post.`,
        });

      return res.status(200).json({
        success: true,
        message: 'Update post successfully.',
        post: _post,
      });
    },
  );
});

router.delete('/:id', requireSignin, async (req, res) => {
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
        error:
          'Your request could not be processed. Please try again.',
      });

    if (!_post)
      return res.status(400).json({
        success: false,
        message: `You can't delete this post.`,
      });

    return res.status(200).json({
      success: true,
      message: 'Delete post successfully.',
      post: _post,
    });
  });
});

router.get('/', async (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 100;

  await Post.find()
    .sort({ createAt: 'desc' })
    .skip((Number(page) - 1) * +limit)
    .limit(Number(limit))
    .populate('createBy')
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
          numOfCmt: post.numOfCmt,
          createAt: post.createAt,
          updateAt: post.updateAt,
          action: post.action,
        };
      });

      return res.status(200).json({
        success: true,
        posts: _posts,
      });
    });
});

router.get('/:userId', async (req, res) => {
  const userId = req.params.userId;
  const page = req.query.page || 1;
  const limit = req.query.limit || 100;

  await Post.find({ createBy: userId }, {})
    .sort({ createAt: 'desc' })
    .skip((Number(page) - 1) * +limit)
    .limit(Number(limit))
    .populate('createBy')
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
          numOfCmt: post.numOfCmt,
          createAt: post.createAt,
          updateAt: post.updateAt,
          action: post.action,
        };
      });

      return res.status(200).json({
        success: true,
        posts: _posts,
      });
    });
});

router.post('/comment/:id', async (req, res) => {
  const user = req.user._id;
  const id = req.params.id;
  const query = {
    _id: id,
  };
  const update = req.body;

  await Post.find(query, update).exec((err, _post) => {
    if (err)
      return res.status(400).json({
        error:
          'Your request could not be processed. Please try again.',
      });

    if (!_post)
      return res.status(400).json({
        success: false,
        message: `You can't delete this post.`,
      });

    return res.status(200).json({
      success: true,
      message: 'Delete post successfully.',
      post: _post,
    });
  });
});


module.exports = router;
