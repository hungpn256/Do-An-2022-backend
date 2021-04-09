const router = require('express').Router();

const { requireSignin } = require('../../middleware/index.js');
const multer = require('multer');
const { storage } = require('../../helps/upload.js');

const User = require('../../models/user.js');
const keys = require('../../config/keys.js');

const upload = multer({ storage });

router.get('/profile', requireSignin, async (req,res) => {
    const user = req.user;
    User.findById(user.id)
    .exec((err, _user) => {
        if(err) 
            return res.status(500).json({ 
                success: false,
                error: 'Your request could not be processed. Please try again.' 
            });
        if(!user) 
            return res.status(401).json({ 
                success: false,
                message: "User doesn't exist."
            });
        else{
            return res.status(200).json({
                success: true,
                user: {
                    _id: _user._id,
                    email: _user.email,
                    phoneNumber: _user.phoneNumber,
                    name: {
                        firstName: _user.firstName,
                        lastName: _user.lastName
                    },
                    avatar: _user.avatar,
                    gender: _user.gender,
                    role: _user.role
                }
            });
        }
    });
    
});

router.put('/profile', requireSignin, async (req,res) => {
    const user = req.user;
    const update = req.body;
    const query = user.id;
    try {
        const updateTime = Date.now();
        update.update = updateTime;
        const _user = await User.findByIdAndUpdate(query, update, {new: true});
        
        res.status(200).json({
            success: true,
            message: 'Your profile is successfully updated!',
            user : {
                _id: _user._id,
                email: _user.email,
                phoneNumber: _user.phoneNumber,
                name: {
                    firstName: _user.firstName,
                    lastName: _user.lastName
                },
                avatar: _user.avatar,
                gender: _user.gender,
                role: _user.role
            }
        })
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Your request could not be processed. Please try again.' 
        });
    }
});

router.put('/avatar', requireSignin, upload.single('avatar') ,async (req,res) => {
    res.send('Nani')
});

module.exports = router;