const router = require('express').Router();

const authRoutes = require('./auth.js');
const userRoutes = require('./user.js');
const postRoutes = require('./post.js');
const friendRoutes = require('./friend.js');
const imageUploadRoutes = require('./file-upload.js');

// auth routes
router.use('/auth', authRoutes);

// user routes
router.use('/user', userRoutes);

// post routes
router.use('/post', postRoutes);

// friend routes
router.use('/friend', friendRoutes);

router.use('/images', imageUploadRoutes);

module.exports = router;