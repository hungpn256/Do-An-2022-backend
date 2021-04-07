const router = require('express').Router();

const authRoutes = require('./auth.js');
const userRoutes = require('./user.js');
const postRoutes = require('./post.js');

// auth routes
router.use('/auth', authRoutes);

// user routes
router.use('/user', userRoutes);

// post routes
router.use('/post', postRoutes);

module.exports = router;