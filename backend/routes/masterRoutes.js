const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getLocations,
  getDivisions,
  getDepartments
} = require('../controllers/masterController');

const router = express.Router();

// Fetch all active Locations
router.get('/locations', protect, getLocations);

// Fetch active Divisions filtered by locationId
router.get('/divisions', protect, getDivisions);

// Fetch active Departments filtered by divisionId
router.get('/departments', protect, getDepartments);

module.exports = router;
