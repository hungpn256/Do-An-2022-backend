const { requireSignin } = require('../../middleware');
const Friend = require('../../models/friend.js');

const router = require('express').Router();

router.post( requireSignin, async (req, res) => {
  const user = req.user;
  const friend = req.body.user;

  try {
    const friends = await Friend.find({
      $or: [{user1: friend}, {user2: friend}]
    });
    
    if(friends.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Friend is made.'
      });
    }

    const makeFriend = new Friend({user1: user, user2: friend});

    makeFriend.save();

    return res.status(200).json({
      success: true,
      message: 'Make friend successfully.',
      makeFriend
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Your request could not be processed. Please try again.'
    })
  }
});

router.get('/:userId', )


module.exports = router