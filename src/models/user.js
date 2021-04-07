const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    gender:{
        type: String,
        enum: ['Male', 'Female', 'Other'],
        require: true
    },
    avatar: {
        type: String
    },
    friends: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    updated: Date,
    created: {
        type: Date,
        default: Date.now
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    }
});

module.exports = mongoose.model('User', userSchema);