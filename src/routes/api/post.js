const router = require('express').Router();
const Post = require('../../models/post.js');

const { requireSignin } = require('../../middleware/index.js');

router.post('/create', requireSignin, (req,res) => {
  const user = req.user;
  const post =  req.body.post;

  post.createBy = user.id;

  const newPost = new Post(post);

  Post.save().exec((err,_post) => {
    if(err)
      return res.status(400).json({ 
        success: false,
        message: 'Your request could not be processed. Please try again.'
      });
    return res.status(201).json({
      success: true,
      message: 'Create post successfully.',
      post: _post
    });
  });
});

router.put('/update', requireSignin, (req,res) => {
  
});

router.delete('/delete', requireSignin, (req,res) => {

});

module.exports = router;
