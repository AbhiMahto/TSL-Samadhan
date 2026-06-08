const fs = require('fs');
const xlsx = require('xlsx');
const Employee = require('../models/Employee');

/**
 * @desc    Get logged-in Employee Profile
 * @route   GET /api/employee/profile
 * @access  Private
 */
const getProfile = async (req, res) => {
  try {
    // req.user is set by the protect middleware
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile details'
    });
  }
};

/**
 * @desc    Get all employees list (Admin only)
 * @route   GET /api/employee/all
 * @access  Private/Admin
 */
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ role: 'employee' })
      .select('-password')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: employees.length,
      employees
    });
  } catch (error) {
    console.error('Get All Employees Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee list'
    });
  }
};

/**
 * @desc    Upload & Parse Excel file to create employees (Admin only)
 * @route   POST /api/employee/upload-excel
 * @access  Private/Admin
 */
const uploadExcel = async (req, res) => {
  try {
    console.log('--- EXCEL UPLOAD DEBUG LOG ---');
    console.log('Content-Type Header:', req.headers['content-type']);
    console.log('File (req.file):', req.file);
    console.log('Body (req.body):', req.body);
    console.log('------------------------------');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an Excel file (.xlsx or .xls)'
      });
    }

    const filePath = req.file.path;
    let workbook;

    try {
      workbook = xlsx.readFile(filePath);
    } catch (err) {
      // Remove temp file if parsing fails
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: 'Invalid Excel file format or corrupted file'
      });
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(sheet);

    if (rawData.length === 0) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: 'The uploaded Excel sheet is empty'
      });
    }

    // Required columns validation
    const requiredCols = ['emp_id', 'name', 'phone', 'email', 'department', 'designation'];
    const sheetCols = Object.keys(rawData[0]);
    const missingCols = requiredCols.filter(col => !sheetCols.includes(col));

    if (missingCols.length > 0) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: `Missing required columns: ${missingCols.join(', ')}`
      });
    }

    const newEmployees = [];
    const duplicates = [];
    const invalidRows = [];
    const seenEmpIdsInExcel = new Set();

    // Fetch existing employee IDs from database to prevent duplicate insertions
    const existingEmployees = await Employee.find({}, 'emp_id');
    const existingEmpIds = new Set(existingEmployees.map(emp => emp.emp_id));

    // Process each row
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const rowNum = i + 2; // Excel rows start at 1, row 1 is header

      const emp_id = row.emp_id ? String(row.emp_id).trim() : '';
      const name = row.name ? String(row.name).trim() : '';
      const phone = row.phone ? String(row.phone).trim() : '';
      const email = row.email ? String(row.email).trim() : '';
      const department = row.department ? String(row.department).trim() : '';
      const designation = row.designation ? String(row.designation).trim() : '';

      // Row level validation
      if (!emp_id || !name || !phone || !email || !department || !designation) {
        invalidRows.push({ row: rowNum, error: 'All fields must be filled' });
        continue;
      }

      // Check duplicates inside the Excel sheet itself
      if (seenEmpIdsInExcel.has(emp_id)) {
        duplicates.push({ row: rowNum, emp_id, reason: 'Duplicate in sheet' });
        continue;
      }
      seenEmpIdsInExcel.add(emp_id);

      // Check duplicate in database
      if (existingEmpIds.has(emp_id)) {
        duplicates.push({ row: rowNum, emp_id, reason: 'Already exists in system' });
        continue;
      }

      // Valid employee structure
      newEmployees.push({
        emp_id,
        name,
        phone,
        email,
        department,
        designation,
        password: null, // First login must set password
        firstLogin: true,
        status: 'active',
        role: 'employee'
      });
    }

    // Insert records to MongoDB if any exist
    let insertedCount = 0;
    if (newEmployees.length > 0) {
      const result = await Employee.insertMany(newEmployees);
      insertedCount = result.length;
    }

    // Clean up temporary file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.status(200).json({
      success: true,
      message: `Excel data processed: ${insertedCount} employees imported successfully.`,
      summary: {
        totalRows: rawData.length,
        imported: insertedCount,
        skippedDuplicates: duplicates.length,
        skippedInvalid: invalidRows.length
      },
      duplicates,
      invalidRows
    });
  } catch (error) {
    console.error('Upload Excel Error:', error);
    // Cleanup file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to process Excel upload. Server error.'
    });
  }
};

module.exports = {
  getProfile,
  getAllEmployees,
  uploadExcel
};
