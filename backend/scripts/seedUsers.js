require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const Employee = require('../models/Employee');

const seedUsers = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log('Seeding workflow test accounts...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const testUsers = [
      {
        emp_id: 'emp1',
        name: 'Employee One',
        phone: '+919876543210',
        email: 'employee1@example.com',
        department: 'IT Services',
        designation: 'Software Engineer',
        password: hashedPassword,
        firstLogin: false,
        role: 'employee',
        status: 'active'
      },
      {
        emp_id: 'approver1',
        name: 'Approver One',
        phone: '+919876543211',
        email: 'mahtoak102@gmail.com',
        department: 'IT Services',
        designation: 'IT Manager',
        password: hashedPassword,
        firstLogin: false,
        role: 'approver',
        status: 'active'
      },
      {
        emp_id: 'ibmd1',
        name: 'IBMD One',
        phone: '+919876543212',
        department: 'Shared Services',
        designation: 'IBMD Officer',
        email: 'rajkumarmahato868@gmail.com',
        password: hashedPassword,
        firstLogin: false,
        role: 'ibmd',
        status: 'active'
      },
      {
        emp_id: 'sales1',
        name: 'Sales One',
        phone: '+919876543213',
        department: 'Sales',
        designation: 'Sales Manager',
        email: 'shrutikumari72758@gmail.com',
        password: hashedPassword,
        firstLogin: false,
        role: 'sales',
        status: 'active'
      }
    ];

    for (const u of testUsers) {
      const exists = await Employee.findOne({ emp_id: u.emp_id });
      if (!exists) {
        await Employee.create(u);
        console.log(`Successfully created test user: ${u.emp_id} (${u.role})`);
      } else {
        // Update role and password to make sure it matches
        exists.role = u.role;
        exists.password = u.password;
        exists.firstLogin = false;
        exists.email = u.email;
        exists.name = u.name;
        exists.phone = u.phone;
        await exists.save();
        console.log(`Test user ${u.emp_id} (${u.role}) already exists, updated information.`);
      }
    }

    console.log('Seeding complete. You can login with emp_id and password: password123');
    mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('Seeding users failed:', error.message);
    process.exit(1);
  }
};

seedUsers();
