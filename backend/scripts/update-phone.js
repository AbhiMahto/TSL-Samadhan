require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const connectDB = require('../config/db');

const updatePhone = async () => {
  try {
    await connectDB();
    
    const empId = 'EMP1021';
    const targetPhone = '+919470507693'; // User's real phone number

    console.log(`Searching for Employee: ${empId}...`);
    const employee = await Employee.findOne({ emp_id: empId });
    
    if (!employee) {
      console.error(`Employee ${empId} not found in database.`);
      process.exit(1);
    }

    console.log(`Current Phone: ${employee.phone}`);
    employee.phone = targetPhone;
    await employee.save();
    
    console.log(`--------------------------------------------------`);
    console.log(`PHONE NUMBER UPDATED SUCCESSFULLY!`);
    console.log(`Employee ID : ${employee.emp_id}`);
    console.log(`New Phone   : ${employee.phone} (E.164 Format)`);
    console.log(`--------------------------------------------------`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating phone number:', error.message);
    process.exit(1);
  }
};

updatePhone();
