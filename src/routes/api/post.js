const router = require('express').Router();
const Post = require('../../models/post.js');

const { requireSignin } = require('../../middleware/index.js');

router.post('/create', requireSignin, (req,res) => {
  const user = req.user;
  const post =  req.body;

  post.createBy = user.id;

  const newPost = new Post(post);

  newPost.save(async (err,_post) => {
    if(err) {
        return res.status(400).json({
            error: 'Your request could not be processed. Please try again.'
        });
    }
    return res.status(201).json({
      success: true,
      message: 'Create post successfully.',
      post: _post
    });

    
});
});

router.put('/:id', requireSignin, async (req,res) => {
  const user = req.user.id;
  const id = req.params.id;
  const query = {
    _id: id,
    createBy: user
  }
  const update = req.body;


  await Post.findOneAndUpdate(query, update, {new: true})
  .exec((err, _post) => {
    if(err) 
      return res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      });

    if(!_post)
      return res.status(400).json({
        success: false,
        message: `You can't update this post.`
      });
    
    return res.status(200).json({
      success: true,
      message: 'Update post successfully.',
      post: _post
    });

  });
    

});

router.delete('/:id', requireSignin, async (req,res) => {
  const user = req.user.id;
  const id = req.params.id;
  const query = {
    _id: id,
    createBy: user
  }
  const update = req.body;


  await Post.findOneAndDelete(query, update)
  .exec((err, _post) => {
    if(err) 
      return res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      });

    if(!_post)
      return res.status(400).json({
        success: false,
        message: `You can't delete this post.`
      });
    
    return res.status(200).json({
      success: true,
      message: 'Delete post successfully.',
      post: _post
    });

  });
});



module.exports = router;