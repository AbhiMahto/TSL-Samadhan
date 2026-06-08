require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const connectDB = require('./config/db');
const Employee = require('./models/Employee');

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

// Initialize server
const app = express();

// Set CORS policies
app.use(cors());

// Body parser middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, './uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Map Routers
app.use('/api/auth', authRoutes);
app.use('/api/employee', employeeRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'Healthy', timestamp: new Date() });
});

// Serve static assets or default API page
app.get('/', (req, res) => {
  res.send('Employee Authentication and Management API is running.');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message);

  // Custom response for Multer file filter limits/errors
  if (err.message && err.message.includes('Only Excel files')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  return res.status(500).json({
    success: false,
    message: err.message || 'An internal server error occurred.'
  });
});

// Helper function to seed an initial administrator account
const seedAdmin = async () => {
  try {
    const adminExists = await Employee.findOne({ emp_id: 'admin' });

    if (!adminExists) {
      console.log('Seeding initial administrator account...');

      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      await Employee.create({
        emp_id: 'admin',
        name: 'System Admin',
        phone: '+919999999999', // Placeholder E.164 phone
        email: 'admin@company.com',
        department: 'Administration',
        designation: 'IT System Admin',
        password: hashedPassword,
        firstLogin: false, // Admin password is preconfigured
        role: 'admin',
        status: 'active'
      });

      console.log('--------------------------------------------------');
      console.log('ADMINISTRATOR ACCOUNT SEEDED');
      console.log(`Employee ID: admin`);
      console.log(`Password   : ${adminPassword}`);
      console.log('--------------------------------------------------');
    } else {
      console.log('Admin account already exists in database.');
    }
  } catch (error) {
    console.error('Error seeding admin account:', error.message);
  }
};

// Establish Database connection, then seed admin and listen
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Seed administrator
    await seedAdmin();

    // Start listening
    app.listen(PORT, () => {
      console.log(`Express server running on port: ${PORT}`);
      console.log(`API URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
