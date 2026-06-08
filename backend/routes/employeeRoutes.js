const express = require('express');
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getProfile,
  getAllEmployees,
  uploadExcel
} = require('../controllers/employeeController');

const router = express.Router();

// Profile details for authenticated employee
router.get('/profile', protect, getProfile);

// Get all employees list (Admin only)
router.get('/all', protect, admin, getAllEmployees);

// Upload Excel document to bulk-register employees (Admin only)
router.post('/upload-excel', protect, admin, upload.single('file'), uploadExcel);

module.exports = router;
