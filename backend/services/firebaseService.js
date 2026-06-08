const axios = require('axios');
const crypto = require('crypto');
const OtpVerification = require('../models/OtpVerification');

/**
 * Sends SMS OTP to a phone number.
 * If Firebase keys are not provided, it falls back to generating a mock OTP and saving it to MongoDB.
 * 
 * @param {string} phoneNumber Format: E.164 (e.g. +919876543210)
 * @param {string} empId Employee ID
 * @returns {Promise<{ sessionInfo: string, isMock: boolean }>}
 */
const sendSmsOtp = async (phoneNumber, empId) => {
  const apiKey = process.env.FIREBASE_API_KEY;

  // Normalize phone number to E.164 format
  let formattedPhone = phoneNumber;
  if (formattedPhone && !formattedPhone.startsWith('+')) {
    // If it's a 10-digit number, assume +91 country code (India)
    if (/^\d{10}$/.test(formattedPhone)) {
      formattedPhone = `+91${formattedPhone}`;
    } else {
      formattedPhone = `+${formattedPhone}`;
    }
  }

  // Check if Firebase API Key exists and is not a placeholder
  const isFirebaseConfigured = apiKey && !apiKey.startsWith('YOUR_');

  if (!isFirebaseConfigured) {
    return await generateAndSaveMockOtp(formattedPhone, empId);
  }

  try {
    console.log(`Attempting to send OTP via Firebase to ${formattedPhone}...`);
    // Firebase Auth REST API for sending verification code
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${apiKey}`,
      {
        phoneNumber: formattedPhone
      }
    );

    if (response.data && response.data.sessionInfo) {
      console.log(`Firebase OTP sent successfully to ${phoneNumber}`);
      return {
        sessionInfo: response.data.sessionInfo,
        isMock: false
      };
    } else {
      throw new Error('No sessionInfo returned from Firebase');
    }
  } catch (error) {
    const errorMsg = error.response && error.response.data && error.response.data.error 
      ? error.response.data.error.message 
      : error.message;

    console.error(`Firebase OTP sending failed: ${errorMsg}`);
    
    console.warn(`\n[WARNING] Falling back to Mock OTP because Firebase returned an error: "${errorMsg}".`);
    if (errorMsg === 'BILLING_NOT_ENABLED') {
      console.warn(`[INFO] To use real SMS authentication, you must upgrade your Firebase project to the paid Blaze plan.`);
      console.warn(`[INFO] Check Firebase console: https://console.firebase.google.com/project/${process.env.FIREBASE_PROJECT_ID}/overview`);
    }
    console.warn(`Falling back to local mock OTP generator for testing.\n`);

    return await generateAndSaveMockOtp(phoneNumber, empId);
  }
};

/**
 * Verifies SMS OTP using Firebase or local DB verification.
 * 
 * @param {string} sessionInfo The session identifier
 * @param {string} code The 6-digit verification code
 * @returns {Promise<{ success: boolean, message: string }>}
 */
const verifySmsOtp = async (sessionInfo, code) => {
  // Check if this is a local mock session
  const localSession = await OtpVerification.findOne({ sessionInfo });

  if (localSession) {
    if (localSession.otp === code) {
      // Success, delete the session so it can't be reused
      await OtpVerification.deleteOne({ _id: localSession._id });
      return { success: true, message: 'OTP verified successfully (Mock)' };
    } else {
      return { success: false, message: 'Invalid verification code' };
    }
  }

  // If not found locally, try Firebase verification
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey || apiKey.startsWith('YOUR_')) {
    return { success: false, message: 'Invalid verification code or session expired' };
  }

  try {
    console.log(`Verifying OTP via Firebase for session: ${sessionInfo.substring(0, 15)}...`);
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=${apiKey}`,
      {
        sessionInfo: sessionInfo,
        code: code
      }
    );

    if (response.data && response.data.idToken) {
      console.log('Firebase OTP verification successful!');
      return { success: true, message: 'OTP verified successfully via Firebase' };
    } else {
      return { success: false, message: 'Invalid verification code' };
    }
  } catch (error) {
    const errorMsg = error.response && error.response.data && error.response.data.error 
      ? error.response.data.error.message 
      : error.message;
    console.error(`Firebase OTP verification failed: ${errorMsg}`);
    return { success: false, message: `Verification failed: ${errorMsg}` };
  }
};

/**
 * Generates a mock OTP, saves it in MongoDB with TTL, and logs it to console.
 */
const generateAndSaveMockOtp = async (phoneNumber, empId) => {
  const otp = '123456'; // Standard mock OTP for testing ease, or we can make it dynamic
  // Let's generate a random 6 digit OTP for realistic testing, but allow 123456 as a fallback
  const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Create a pseudo-sessionInfo UUID
  const sessionInfo = `mock_session_${crypto.randomUUID()}`;

  // Save to DB
  await OtpVerification.create({
    phone: phoneNumber,
    emp_id: empId,
    otp: randomOtp,
    sessionInfo: sessionInfo,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
  });

  console.log(`\n==================================================`);
  console.log(`[MOCK OTP SERVICE]`);
  console.log(`Employee ID: ${empId}`);
  console.log(`Phone Number: ${phoneNumber}`);
  console.log(`Generated OTP: ${randomOtp}`);
  console.log(`Session Info: ${sessionInfo}`);
  console.log(`==================================================\n`);

  return {
    sessionInfo: sessionInfo,
    isMock: true,
    // We can also return the otp in development response so the frontend developers can display it automatically,
    // which is useful for testing without checking logs.
    mockOtp: randomOtp
  };
};

module.exports = {
  sendSmsOtp,
  verifySmsOtp
};
