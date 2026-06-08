const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');
const { sendSmsOtp, verifySmsOtp } = require('../services/firebaseService');

// Helper to generate JWT token for authentication (7 days)
const generateAuthToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Helper to generate short-lived JWT token for OTP verification proof (10 minutes)
const generateVerificationToken = (emp_id, purpose) => {
  return jwt.sign({ emp_id, purpose, verified: true }, process.env.JWT_SECRET, {
    expiresIn: '10m'
  });
};

/**
 * @desc    Employee/Admin Login
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { emp_id, password } = req.body;

    // Validate inputs
    if (!emp_id || !password) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and password are required'
      });
    }

    // Find employee
    const employee = await Employee.findOne({ emp_id });
    if (!employee) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Employee ID or password'
      });
    }

    // Check status
    if (employee.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact your administrator.'
      });
    }

    // Check if first-time user
    if (employee.firstLogin && !employee.password) {
      return res.status(400).json({
        success: false,
        message: 'First time login detected. Please set up your password first.',
        isFirstLogin: true
      });
    }

    // Compare passwords
    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Employee ID or password'
      });
    }

    // Generate token
    const token = generateAuthToken(employee._id);

    // Return response
    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: employee._id,
        emp_id: employee.emp_id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        department: employee.department,
        designation: employee.designation,
        role: employee.role,
        firstLogin: employee.firstLogin
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.'
    });
  }
};

/**
 * @desc    Send OTP for First-Time Setup or Forgot Password
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
const sendOtp = async (req, res) => {
  try {
    const { emp_id, purpose } = req.body; // purpose: 'first-time-setup' or 'forgot-password'

    if (!emp_id || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and purpose are required'
      });
    }

    // Find employee
    const employee = await Employee.findOne({ emp_id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee ID not found'
      });
    }

    if (employee.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Employee account is inactive'
      });
    }

    // Validate purpose constraints
    if (purpose === 'first-time-setup') {
      if (!employee.firstLogin || employee.password) {
        return res.status(400).json({
          success: false,
          message: 'Account password has already been set. Please use Login or Forgot Password.'
        });
      }
    } else if (purpose === 'forgot-password') {
      if (employee.firstLogin && !employee.password) {
        return res.status(400).json({
          success: false,
          message: 'First time setup required. Please use first-time setup option.'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid purpose specified'
      });
    }

    // Trigger OTP sending using firebase service
    const otpResult = await sendSmsOtp(employee.phone, employee.emp_id);

    // Partially mask phone number for security in response
    const phone = employee.phone;
    const maskedPhone = phone.substring(0, 3) + '*****' + phone.substring(phone.length - 4);

    const response = {
      success: true,
      sessionInfo: otpResult.sessionInfo,
      phone: maskedPhone,
      message: `OTP sent successfully to registered mobile ending in ${phone.substring(phone.length - 4)}`
    };

    // Include mockOtp in the response in development mode for easy UI testing
    if (otpResult.isMock) {
      response.mockOtp = otpResult.mockOtp;
      response.isMock = true;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Send OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.'
    });
  }
};

/**
 * @desc    Verify OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOtp = async (req, res) => {
  try {
    const { sessionInfo, code, emp_id, purpose } = req.body;

    if (!sessionInfo || !code || !emp_id || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'sessionInfo, code, emp_id, and purpose are required'
      });
    }

    const verification = await verifySmsOtp(sessionInfo, code);

    if (verification.success) {
      // Generate a short-lived proof-of-verification token
      const verificationToken = generateVerificationToken(emp_id, purpose);
      
      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        verificationToken
      });
    } else {
      return res.status(400).json({
        success: false,
        message: verification.message || 'Invalid verification code'
      });
    }
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify OTP. Please try again.'
    });
  }
};

/**
 * @desc    Setup Password for First-Time Users
 * @route   POST /api/auth/setup-password
 * @access  Public
 */
const setupPassword = async (req, res) => {
  try {
    const { password, verificationToken } = req.body;

    if (!password || !verificationToken) {
      return res.status(400).json({
        success: false,
        message: 'Password and verification token are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Verify verificationToken
    let decoded;
    try {
      decoded = jwt.verify(verificationToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is invalid or expired. Please verify OTP again.'
      });
    }

    if (decoded.purpose !== 'first-time-setup') {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token purpose'
      });
    }

    // Find employee
    const employee = await Employee.findOne({ emp_id: decoded.emp_id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found'
      });
    }

    if (!employee.firstLogin || employee.password) {
      return res.status(400).json({
        success: false,
        message: 'Password has already been configured for this account'
      });
    }

    // Hash password and save
    const salt = await bcrypt.genSalt(10);
    employee.password = await bcrypt.hash(password, salt);
    employee.firstLogin = false;
    await employee.save();

    // Auto-generate auth JWT for immediate login session after setup
    const token = generateAuthToken(employee._id);

    return res.status(200).json({
      success: true,
      message: 'Password configured successfully. Welcome!',
      token,
      user: {
        _id: employee._id,
        emp_id: employee.emp_id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        department: employee.department,
        designation: employee.designation,
        role: employee.role,
        firstLogin: false
      }
    });
  } catch (error) {
    console.error('Setup Password Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to configure password. Please try again.'
    });
  }
};

/**
 * @desc    Reset Password for Forgot Password Flow
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    const { password, verificationToken } = req.body;

    if (!password || !verificationToken) {
      return res.status(400).json({
        success: false,
        message: 'Password and verification token are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Verify verificationToken
    let decoded;
    try {
      decoded = jwt.verify(verificationToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is invalid or expired. Please verify OTP again.'
      });
    }

    if (decoded.purpose !== 'forgot-password') {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token purpose'
      });
    }

    // Find employee
    const employee = await Employee.findOne({ emp_id: decoded.emp_id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found'
      });
    }

    // Hash password and save
    const salt = await bcrypt.genSalt(10);
    employee.password = await bcrypt.hash(password, salt);
    // Ensure firstLogin is false, just in case
    employee.firstLogin = false;
    await employee.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again.'
    });
  }
};

module.exports = {
  login,
  sendOtp,
  verifyOtp,
  setupPassword,
  resetPassword
};
