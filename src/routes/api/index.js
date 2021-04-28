const router = require('express').Router();

const authRoutes = require('./auth.js');
const userRoutes = require('./user.js');
const postRoutes = require('./post.js');
const imageUploadRoutes = require('./file-upload.js');
const { queryVar } = require('../../services/query.js');
const User = require('../../models/user.js');
const Post = require('../../models/post.js');
// auth routes
router.use('/auth', authRoutes);

// user routes
router.use('/user', userRoutes);

// post routes
router.use('/post', postRoutes);

router.use('/images', imageUploadRoutes);


router.get('/search', async (req,res) => {
  let q = req.query.q;
  q = queryVar(q);
  console.log(q);
  User.find(q).then(result => {
    res.json(result);
  }).catch(err => {
    return res.json({err});
  });

})
module.exports = router;