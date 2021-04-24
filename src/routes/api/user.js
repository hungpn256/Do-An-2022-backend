const router = require('express').Router();

const { requireSignin, checkLogin } = require('../../middleware/index.js');

const User = require('../../models/user.js');
const keys = require('../../config/keys.js');


router.get('/profile', requireSignin, async (req, res) => {
  const user = req.user;
  User.findById(user._id).exec((err, _user) => {
    if (err)
      return res.status(500).json({
        success: false,
        error:
          'Your request could not be processed. Please try again.',
      });
    if (!_user)
      return res.status(401).json({
        success: false,
        message: "User doesn't exist.",
      });
    else {
      return res.status(200).json({
        success: true,
        user: {
          _id: _user._id,
          email: _user.email,
          phoneNumber: _user.phoneNumber,
          name: {
            firstName: _user.firstName,
            lastName: _user.lastName,
          },
          follow: _user.follow,
          location: _user.location,
          relation: _user.relation,
          avatar: _user.avatar,
          cover: _user.cover,
          gender: _user.gender,
          role: _user.role,
        },
      });
    }
  });
});

router.get('/recomment', requireSignin, async (req, res) => {

  const userId = req.user._id;
  const suggestedUsers = [];
  try {
    const numOfUser = await User.estimatedDocumentCount();
    for(let i = 0; i < 5; i++){
      const count = Math.floor(Math.random()*numOfUser);
      const _user = await User.find({_id:{$ne: userId}}).skip(count).limit(1);

      if(_user.length>0 && _user[0]._id !== userId && !suggestedUsers.some(v =>v._id === _user[0])){
        let __user = {
          _id: _user[0]._id,
          name: {
            firstName: _user[0].firstName,
            lastName: _user[0].lastName,
          },
          avatar: _user[0].avatar
        }
        suggestedUsers.push(__user);
      }
      else{
        i--;
      }
    }
    return res.json(suggestedUsers);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Your request could not be processed. Please try again.',
    });
  }
  
});

router.put('/follow/:userId', requireSignin, async (req,res) => {
  const _id = req.user._id;
  const _userId = req.params.userId;

  await User.findById(_id).exec((err, user) => {
    if(err) {
      return res.status(500).json({
        success: false,
        error: 'Your request could not be processed. Please try again.',
      });
    }
    user.follow = [...user.follow, _userId];
    user.save();
    return res.status(200).json({
      success: true,
      message: "Follow successfully."
    })
  });
});

router.get('/search?', async (req, res) => {
  const name = req.query.name;
});

router.get('/:id', checkLogin, async (req, res) => {
  const id = req.params.id;
  const userId = req.user._id;
  let check = 3;
  if(req.user !== 3){
    if(userId === id) {
      check = 0;
    }
    else{

      const currentUser = await User.findById(userId).catch(err => console.log(err));
  
      if(currentUser.follow.some(id)){
        check = 1;
      }
      else {
        check = 2;
      }
    }
  }

  User.findById(id).exec((err, _user) => {
    if (err)
      return res.status(500).json({
        success: false,
        error:
          'Your request could not be processed. Please try again.',
      });
    if (!_user)
      return res.status(401).json({
        success: false,
        message: "User doesn't exist.",
      });
    else {
      return res.status(200).json({
        success: true,
        user: {
          _id: _user._id,
          email: _user.email,
          phoneNumber: _user.phoneNumber,
          name: {
            firstName: _user.firstName,
            lastName: _user.lastName,
          },
          location: _user.location,
          relation: _user.relation,
          avatar: _user.avatar,
          cover: _user.cover,
          gender: _user.gender,
          role: _user.role,
        },
        isFollowed: check
      });
    }
  });
});

router.put('/profile', requireSignin, async (req, res) => {
  const user = req.user;
  const update = req.body;
  const query = user._id;
  try {
    const updateTime = Date.now();
    update.update = updateTime;
    const _user = await User.findByIdAndUpdate(query, update, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: 'Your profile is successfully updated!',
      user: {
        _id: _user._id,
        email: _user.email,
        phoneNumber: _user.phoneNumber,
        name: {
          firstName: _user.firstName,
          lastName: _user.lastName,
        },
        location: _user.location,
        relation: _user.relation,
        avatar: _user.avatar,
        cover: _user.cover,
        gender: _user.gender,
        role: _user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Your request could not be processed. Please try again.',
    });
  }
});


module.exports = router;
