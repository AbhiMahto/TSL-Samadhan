const mongoose = require('mongoose');

const OtpVerificationSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true
    },
    emp_id: {
      type: String,
      required: true,
      trim: true
    },
    otp: {
      type: String,
      required: true
    },
    sessionInfo: {
      type: String,
      required: true,
      unique: true
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      index: { expires: '5m' } // TTL index to auto-delete after 5 minutes
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('OtpVerification', OtpVerificationSchema);
