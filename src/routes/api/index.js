const router = require('express').Router();

const authRoutes = require('./auth.js');

// auth routes
router.use('/auth',authRoutes);

module.exports = router;