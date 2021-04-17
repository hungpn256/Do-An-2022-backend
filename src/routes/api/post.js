const router = require('express').Router();
const Post = require('../../models/post.js');

const { upload } = require('../../helps/upload.js');
const { requireSignin } = require('../../middleware/index.js');
const { uploadFile, generatePublicUrl, deleteFile } = require('../../helps/google_drive_api.js')

const uploadImages = async (images) => {

  const result = [];

  try {
    if(Array.isArray(images)){
      for( let image of images) {
        const resultUploadFile = await uploadFile(image.filename);
        if(!resultUploadFile.success) {
            return {
                success: false,
                message: "Upload Image Fail."
            };
        }
        const resultUrlFile = await generatePublicUrl(resultUploadFile.data.id);
    
        if(!resultUrlFile.success){
            return {
                success: false,
                message: "Generate Public Url Image Fail."
            };
        }
        result.push( {
          id: resultUploadFile.data.id,
          viewUrl: resultUrlFile.data.thumbnailLink,
          downloadUrl: resultUrlFile.data.webContentLink
        });
      }
      return {
        success: true,
        result
      }
    }
    else {
      return {
        success: false,
        message: 'Images are not a array.'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Your request could not be processed. Please try again.'
    };
  }

};



router.post('/create', requireSignin, upload.array("image"), async (req,res) => {
  const user = req.user;
  const {text} =  req.body;
  const files = req.files;

  const post = {
    text,
    createBy: user.id
  }

  if(files.length > 0){
    const upload = await uploadImages(files);
    if(!upload.success){
      return res.status(400).json({
        success: false,
        message: upload.message
      });
    }

    post.imgs = upload.result;
  }

  const newPost = new Post(post);
  await newPost.save((err, _post) => {
    if(err) {
      return res.status(400).json({
        success: false,
        message: 'Your request could not be processed. Please try again.'
      });
    }
    if(!_post) {
      return res.status(400).json({
        success: false,
        message: 'You can\'t save post.'
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Create post successfully.',
      post: _post
    });
  });
});

router.put('/:id/text', requireSignin, async (req,res) => {
  const user = req.user.id;
  const id = req.params.id;
  const query = {
    _id: id,
    createBy: user
  }

  const update = {
    text: req.body.text
  }

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


router.get('/:userId?', async (req,res) => {

  const userId = req.params.userId;
  const page = req.query.page ||1;
  const limit = req.query.limit || 100;

  

  await Post.find({createBy: userId}, {})
  .sort({"createAt": "desc"})
  .skip((Number(page)-1)*(+limit))
  .limit(Number(limit))
  .populate('createBy')
  .exec((err,posts) => {
    if(err){
      return res.status(400).json({
        error: err
      });
    }
    
  
    return res.status(200).json({
      success: true,
      posts: posts
    });
  });
})


module.exports = router;