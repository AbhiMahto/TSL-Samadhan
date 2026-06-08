const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  login,
  sendOtp,
  verifyOtp,
  setupPassword,
  resetPassword
} = require('../controllers/authController');

const router = express.Router();

// Rate limiter for general auth routes to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 30 : 200, // Relaxed for development
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiter for OTP requests to save SMS costs / prevent abuse
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 100, // Relaxed for development testing
  message: {
    success: false,
    message: 'Too many OTP requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Map routes
router.post('/login', authLimiter, login);
router.post('/send-otp', otpLimiter, sendOtp);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/setup-password', authLimiter, setupPassword);
router.post('/reset-password', authLimiter, resetPassword);

module.exports = router;
