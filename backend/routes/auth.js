const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');

const SKIP_EMAIL = process.env.SKIP_EMAIL === 'true';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const getValidationMessage = (errors) => errors.array().map(error => error.msg).join(', ');

// ============ REGISTER ============
router.post('/register', [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: getValidationMessage(errors),
        errors: errors.array()
      });
    }

    const username = req.body.username?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;

    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      const field = user.email === email ? 'email' : 'username';
      return res.status(400).json({ message: `This ${field} is already registered` });
    }

    user = new User({ 
      username, 
      email, 
      password,
      isVerified: SKIP_EMAIL ? true : false
    });
    
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============ LOGIN ============
router.post('/login', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============ GOOGLE LOGIN ============
router.post('/google', async (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your-google-client-id') {
      return res.status(503).json({ message: 'Google login is not configured' });
    }

    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }
    
    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user from Google
      user = new User({
        username: name.replace(/\s+/g, '').toLowerCase() + '_' + googleId.substring(0, 4),
        email: email,
        password: googleId + process.env.JWT_SECRET, // Random secure password
        avatar: picture || '',
        isVerified: true,
        googleId: googleId
      });
      await user.save();
    } else {
      // Update avatar if user exists
      if (!user.avatar && picture) {
        user.avatar = picture;
        await user.save();
      }
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Google login failed' });
  }
});

// ============ FORGOT PASSWORD ============
router.post('/forgot-password', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Password reset link sent to your email.',
      resetToken: SKIP_EMAIL ? resetToken : undefined
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============ RESET PASSWORD ============
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
