const nodemailer = require('nodemailer');

// Helper to determine if SMTP is fully configured in env
const isSmtpConfigured = () => {
  return (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_USER !== 'YOUR_GMAIL_ADDRESS@gmail.com' &&
    process.env.SMTP_PASS &&
    process.env.SMTP_PASS !== 'YOUR_GMAIL_APP_PASSWORD'
  );
};

// Create Nodemailer Transporter
const createTransporter = () => {
  if (isSmtpConfigured()) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return null;
};

/**
 * Sends a notification email to a workflow stakeholder.
 * Falls back to console log simulation if SMTP variables are not defined.
 * 
 * @param {Object} options
 * @param {string} options.to Recipient Email Address
 * @param {string} options.subject Email Subject
 * @param {string} options.text Plaintext Body
 * @param {string} options.html HTML Body
 */
const sendWorkflowEmail = async ({ to, subject, text, html }) => {
  const transporter = createTransporter();
  const fromEmail = process.env.SMTP_FROM || 'samadhan-alert@tatasteel.com';

  if (transporter) {
    try {
      console.log(`Sending email to ${to} using Nodemailer...`);
      const info = await transporter.sendMail({
        from: `"Tata Steel Samadhan" <${fromEmail}>`,
        to,
        subject,
        text,
        html
      });
      console.log(`Email sent successfully: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`SMTP Email dispatch failed: ${error.message}`);
      // Fallback logging on error
      logMockEmail({ to, subject, text, fromEmail, error: error.message });
      return { success: false, fallback: true, message: error.message };
    }
  } else {
    // Simulated print to console when SMTP configuration is missing
    logMockEmail({ to, subject, text, fromEmail });
    return { success: true, simulated: true };
  }
};

/**
 * Helper to log a visually clear Mock Email block in development console.
 */
const logMockEmail = ({ to, subject, text, fromEmail, error }) => {
  console.log(`\n==================================================`);
  console.log(`[DEVELOPMENT MOCK EMAIL SERVICE]`);
  if (error) {
    console.log(`[SMTP ERROR ENCOUNTERED]: ${error}`);
    console.log(`[FALLBACK ACTIVATED]`);
  } else {
    console.log(`[SMTP NOT CONFIGURED - SIMULATING EMAIL]`);
  }
  console.log(`From: "Tata Steel Samadhan" <${fromEmail}>`);
  console.log(`To  : ${to}`);
  console.log(`Subj: ${subject}`);
  console.log(`--------------------- Body -----------------------`);
  console.log(text);
  console.log(`==================================================\n`);
};

module.exports = {
  sendWorkflowEmail
};
