const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/registration', async (req, res) => {
  try {
    const { email, firstName, lastName, mobile, password, photo } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ status: 'fail', message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email, firstName, lastName, mobile,
      password: hashedPassword,
      photo,
    });

    await newUser.save();

    res.status(201).json({ status: 'success', message: 'Registered successfully' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
});

// router.post('/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ status: 'fail', message: 'User not found' });
//     }

//     const isPasswordCorrect = await bcrypt.compare(password, user.password);
//     if (!isPasswordCorrect) {
//       return res.status(401).json({ status: 'fail', message: 'Incorrect password' });
//     }

//     const token = jwt.sign(
//       { id: user._id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     res.json({ status: 'success', token });
//   } catch (err) {
//     res.status(500).json({ status: 'fail', message: err.message });
//   }
// });

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'User not found' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ status: 'fail', message: 'Incorrect password' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      status: 'success',
      token,
      data: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        mobile: user.mobile,
        photo: user.photo,
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
});

router.post('/profileUpdate', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, mobile, photo } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, mobile, photo },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ status: 'fail', message: 'User not found' });
    }

    res.json({ status: 'success', data: updatedUser });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
});

router.get('/RecoverVerifyEmail/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'Email not registered' });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Recovery OTP',
      text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
    });

    res.json({ status: 'success', message: 'OTP sent to your email' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
});

router.get('/RecoverVerifyOTP/:email/:otp', async (req, res) => {
  try {
    const { email, otp } = req.params;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'User not found' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ status: 'fail', message: 'Invalid OTP' });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ status: 'fail', message: 'OTP expired' });
    }

    res.json({ status: 'success', message: 'OTP verified' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
});

router.post('/RecoverResetPass', async (req, res) => {
  try {
    const { email, OTP, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'User not found' });
    }

    if (user.otp !== OTP) {
      return res.status(400).json({ status: 'fail', message: 'Invalid OTP' });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ status: 'fail', message: 'OTP expired' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ status: 'success', message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
});

module.exports = router;