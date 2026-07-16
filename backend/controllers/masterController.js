const Location = require('../models/Location');
const Division = require('../models/Division');
const Department = require('../models/Department');

/**
 * @desc    Get all active Locations
 * @route   GET /api/master/locations
 * @access  Private
 */
const getLocations = async (req, res) => {
  try {
    const locations = await Location.find({ active: true }).sort({ name: 1 });
    return res.status(200).json(locations);
  } catch (error) {
    console.error('Get Locations Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve locations. Server error.'
    });
  }
};

/**
 * @desc    Get active Divisions for a Location
 * @route   GET /api/master/divisions
 * @access  Private
 */
const getDivisions = async (req, res) => {
  try {
    const { locationId } = req.query;
    if (!locationId) {
      return res.status(400).json({
        success: false,
        message: 'locationId query parameter is required.'
      });
    }

    const divisions = await Division.find({ locationId, active: true }).sort({ name: 1 });
    return res.status(200).json(divisions);
  } catch (error) {
    console.error('Get Divisions Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve divisions. Server error.'
    });
  }
};

/**
 * @desc    Get active Departments for a Division
 * @route   GET /api/master/departments
 * @access  Private
 */
const getDepartments = async (req, res) => {
  try {
    const { divisionId } = req.query;
    if (!divisionId) {
      return res.status(400).json({
        success: false,
        message: 'divisionId query parameter is required.'
      });
    }

    const departments = await Department.find({ divisionId, active: true }).sort({ name: 1 });
    return res.status(200).json(departments);
  } catch (error) {
    console.error('Get Departments Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve departments. Server error.'
    });
  }
};

module.exports = {
  getLocations,
  getDivisions,
  getDepartments
};
