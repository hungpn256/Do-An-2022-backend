const { check, validationResult } = require('express-validator');

module.exports.validateSignupRequest = [
    check('email')
    .isEmail()
    .withMessage('Valid Email is required'),
    check('password')
    .isLength({min:6})
    .withMessage('Password must be at least 6 characters'),
    check('phoneNumber')
    .isMobilePhone()
    .withMessage('phone number is required.')

];

module.exports.validateSigninRequest = [
    check('email')
    .isEmail()
    .withMessage('Valid Email is required'),
    check('password')
    .isLength({min:6})
    .withMessage('Password must be at least 6 characters')

];

module.exports.isRequestValidated = (req, res, next) => {
    const errors = validationResult(req);
    if(errors.array().length > 0){
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
}