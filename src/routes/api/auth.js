const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const User = require('../../models/user.js');
const keys = require('../../config/keys.js');

const {secret, tokenLife} = keys.jwt;

router.post('/register', (req,res) => {
    const {email, firstName, lastName, password} = req.body;

    if(!email) {
        return res.status(400).json({error: 'You must enter an email address.'});
    }

    if(!firstName || !lastName ){
        return res.status(400).json({error: 'You must enter your full name.'});
    }

    if(!password) {
        return res.status(400).json({ error: 'You must enter a password.'});
    }

    User.findOne({ email }, async (err, existedUser) => {
        if(err){
            next(err);
        }

        if(existedUser) {
            return res.status(400).json({ error: 'That email address is already in use.'});
        }

        const user = new User({
            email,
            password,
            firstName,
            lastName
        });

        bcrypt.genSalt(10, (err,salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                if(err){
                    return res.status(400).json({
                        error: 'Your request could not be processed. Please try again.'
                    });
                }
                user.password = hash;

                user.save(async (err,user) => {
                    if(err) {
                        return res.status(400).json({
                            error: 'Your request could not be processed. Please try again.'
                        });
                    }
                    return res.status(201).json({
                        success: true,
                        user: user
                    });

                    
                });
            });
        });
    });
});

router.post('/login', (req,res) => {
    const {email, password} = req.body;

    if(!email) {
        return res.status(400).json({error: 'You must enter an email address.'});
    }


    if(!password) {
        return res.status(400).json({ error: 'You must enter a password.'});
    }

    User.findOne({ email }).then( user => {

        if(!user) {
            return res.status(400).json({ error: 'No user found for this email address.'});
        }

        bcrypt.compare(password,user.password).then(isMatch => {
            if(isMatch) {
                const payload = {
                    id: user.id
                };

                jwt.sign(payload, secret, {expiresIn: tokenLife}, (err,token) => {
                    res.status(200).json({
                        success: true,
                        token: `Bearer ${token}`,
                        user: user
                    });
                });
            } else{
                res.status(401).json({
                    success: false,
                    error: 'Password incorrect'
                });
            }
        });
    });
});

module.exports = router;