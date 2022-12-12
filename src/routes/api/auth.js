const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {
  validateSigninRequest,
  validateSignupRequest,
  isRequestValidated,
} = require("../../validations/auth.js");

const User = require("../../models/user.js");
const keys = require("../../config/keys.js");
const { sendEmail } = require("../../services/mailer.js");
const { requireSignin } = require("../../middleware/index.js");

const { secret, tokenLife } = keys.jwt;

router.post(
  "/register",
  validateSignupRequest,
  isRequestValidated,
  (req, res) => {
    const { email, firstName, lastName, phoneNumber, password, gender } =
      req.body;

    if (!email) {
      return res
        .status(400)
        .json({ error: "You must enter an email address." });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({ error: "You must enter your full name." });
    }

    if (!password) {
      return res.status(400).json({ error: "You must enter a password." });
    }

    User.findOne({ email }, async (err, existedUser) => {
      if (err) {
        next(err);
      }

      if (existedUser) {
        return res
          .status(400)
          .json({ error: "That email address is already in use." });
      }

      const user = new User({
        email,
        password,
        phoneNumber,
        firstName,
        lastName,
        gender,
      });

      user.save(async (err, user) => {
        if (err) {
          return res.status(400).json({
            error: "Your request could not be processed. Please try again.",
          });
        }
        return res.status(201).json({
          success: true,
          user: {
            _id: user._id,
            email: user.email,
            phoneNumber: user.phoneNumber,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            gender: user.gender,
          },
        });
      });
    });
  }
);

router.post("/login", validateSigninRequest, isRequestValidated, (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: "You must enter an email address." });
  }

  if (!password) {
    return res.status(400).json({ error: "You must enter a password." });
  }

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res
          .status(401)
          .json({ error: "No user found for this email address." });
      }

      bcrypt.compare(password, user.password).then((isMatch) => {
        if (isMatch) {
          const payload = {
            _id: user._id,
          };

          jwt.sign(payload, secret, { expiresIn: tokenLife }, (err, token) => {
            res.status(200).json({
              success: true,
              token: `Bearer ${token}`,
              user: {
                _id: user._id,
                email: user.email,
                phoneNumber: user.phoneNumber,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: user.fullName,
                gender: user.gender,
              },
            });
          });
        } else {
          res.status(401).json({
            success: false,
            error: "Password incorrect",
          });
        }
      });
    })
    .catch((err) => {
      return res.status(400).json({
        success: false,
        message: "Your request could not be processed. Please try again.",
      });
    });
});

router.post("/send-email-password", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "You must enter an email address." });
  }

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res
          .status(401)
          .json({ error: "No user found for this email address." });
      }
      const payload = {
        _id: user._id,
      };

      jwt.sign(payload, secret, { expiresIn: "10m" }, async (err, token) => {
        await sendEmail({
          to: email,
          html: `To retrieve password: <a href="http://localhost:3000/auth/confirm-password?token=${token}">click here</a>`,
          subject: "FORGOT PASSWORD",
          text: "Mạng xã hội",
          from: "Mạng xã hội",
        });
        res.status(200).json({
          success: true,
          token: `Bearer ${token}`,
        });
      });
    })
    .catch((err) => {
      return res.status(400).json({
        success: false,
        message: "Your request could not be processed. Please try again.",
      });
    });
});

router.post("/confirm-password", async (req, res) => {
  try {
    const { password, token } = req.body;

    if (!password) {
      return res.status(400).json({ message: "You must enter an password." });
    }
    const user = jwt.verify(token, keys.jwt.secret);
    if (!user) {
      return res.status(400).json({ message: "Token expired" });
    }
    const { _id } = user;

    const userUpdate = await User.findOne({ _id });
    if (!userUpdate) {
      return res.status(401).json({ message: "No user found ." });
    }
    userUpdate.password = password;
    await userUpdate.save();
    return res.status(200).json({
      success: true,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
      error: err?.message,
    });
  }
});

module.exports = router;
