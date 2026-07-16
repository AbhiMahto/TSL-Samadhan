require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const connectDB = require('./config/db');
const Employee = require('./models/Employee');
const Location = require('./models/Location');
const Division = require('./models/Division');
const Department = require('./models/Department');

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const requestRoutes = require('./routes/requestRoutes');
const masterRoutes = require('./routes/masterRoutes');

// Initialize server
const app = express();

// Set CORS policies
app.use(cors());

// Body parser middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, './uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Map Routers
app.use('/api/auth', authRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/master', masterRoutes);

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

const seedMasterData = async () => {
  try {
    // Clear existing master data collections to ensure the new mapping is applied
    await Location.deleteMany({});
    await Division.deleteMany({});
    await Department.deleteMany({});

    console.log('Seeding initial master data for Locations, Divisions, and Departments...');

    const areaMapping = {
      'TSL Works': {
        'Tubes Division': [
          'JSR TUBES ACCOUNT',
          'JSR TUBES ADMINISTRATION',
          'JSR TUBES HRM',
          'JSR TUBES SECURITY',
          'JSR TUBES MARKETING & SALES',
          'JSR ST MILL',
          'JSR TUBES TECHNOLOGY SERVICES',
          'JSR TUBES PROJECT',
          'JSR MAINTENANCE & UGS',
          'IMPROVEMENT PROJECT & STRATEGY',
          'JSR PT MILL'
        ],
        'One Supply Chain': ['Supply Chain Planning', 'Logistics Operations', 'Inventory Control'],
        'R&D': ['Product Development', 'Process Research', 'R&D Labs'],
        'CSI': ['Customer Service Operations', 'Technical Support'],
        'Engineering & Project': ['Project Planning', 'Construction & Commissioning', 'Design Engineering'],
        'One IT': ['Infrastructure & Cloud', 'Application Development', 'Cybersecurity', 'IT Helpdesk'],
        'Steel Manufacturing': ['Blast Furnace Ops', 'Steel Melting Shop', 'Rolling Mill Ops'],
        'New Material Product': ['Graphene Research', 'Fiber Reinforced Polymer', 'Advanced Materials'],
        'Shared Services': ['Medical Services', 'Corporate Aviation', 'Facilities Management'],
        'Commercial': ['Sales Ops', 'Marketing Strategy', 'Pricing & Contracts'],
        'Corporate Services': ['Legal & Compliance', 'Public Relations', 'Internal Audit'],
        'SHS': ['Safety Management', 'Occupational Health', 'Environment Protection'],
        'HRM': ['Talent Acquisition', 'Employee Relations', 'Training & Development']
      },
      'JSR Outside Works': {
        'Corporate Office': ['Town Services', 'JUSCO Ops', 'HR & IR JSR', 'Finance JSR'],
        'Shared Services': ['Outside Works Maintenance', 'Security Services']
      },
      'TSK Works': {
        'Flat Products': ['SMS (TSK)', 'HSM (TSK)', 'CRM (TSK)', 'Coke Ovens (TSK)', 'Blast Furnace (TSK)'],
        'Shared Services': ['IT Services (TSK)', 'Maintenance (TSK)', 'Safety & Environment (TSK)', 'Medical Services']
      },
      'West Bokaro': {
        'Raw Materials': ['Coal Washery I', 'Coal Washery II', 'Coal Washery III', 'Open Cast Mines', 'Logistics'],
        'Shared Services': ['Safety', 'Local IT Support', 'Administration']
      },
      'Jharia': {
        'Raw Materials': ['Underground Mines', 'Coal Beneficiation', 'Ventilation Systems', 'Mine Safety'],
        'Shared Services': ['Admin & Security', 'Maintenance']
      },
      'Outlocation': {
        'Corporate Office': ['Sales & Marketing (Metro)', 'Regional Offices', 'Warehouse Logistics']
      },
      'Noamundi': {
        'Raw Materials': ['Mines Operations', 'Ore Processing Plant', 'Logistics & Dispatch', 'Quality Control'],
        'Shared Services': ['Mines Security', 'Safety & Environment', 'Administration']
      },
      'Joda/Khondbond': {
        'Raw Materials': ['Joda East Iron Mine', 'Khondbond Iron Mine', 'Logistics', 'Ore Processing'],
        'Shared Services': ['Mines IT', 'Safety & Emergency']
      },
      'HMC Works': {
        'Shared Services': ['HMC Operations', 'Maintenance', 'Safety']
      },
      'Bearings Division': {
        'Flat Products': ['Bearings Manufacturing', 'Quality Assurance', 'Supply Chain', 'Maintenance (Bearings)']
      },
      'Wires': {
        'Long Products': ['Wire Mill JSR', 'Wire Mill Tarapur', 'Maintenance (Wires)', 'Quality Control (Wires)']
      },
      'CRC-W': {
        'Flat Products': ['Cold Rolling CRC-W', 'Annealing & Pickling', 'Maintenance CRC-W']
      },
      'FAMD': {
        'Raw Materials': ['Ferro Alloys Plant Joda', 'Ferro Alloys Plant Bamnipal', 'Chrome Mines Sukinda']
      },
      'TSM': {
        'Shared Services': ['TSM Maintenance', 'TSM Operations', 'Safety']
      },
      'TSG': {
        'Corporate Office': ['Strategy & Development', 'Business Excellence', 'Research & Development']
      }
    };

    for (const [locName, divMap] of Object.entries(areaMapping)) {
      const location = await Location.create({ name: locName, active: true });
      for (const [divName, depts] of Object.entries(divMap)) {
        const division = await Division.create({ name: divName, locationId: location._id, active: true });
        const deptDocs = depts.map(deptName => ({
          name: deptName,
          divisionId: division._id,
          active: true
        }));
        await Department.create(deptDocs);
      }
    }

    console.log('--------------------------------------------------');
    console.log('MASTER DATA SEEDING COMPLETE');
    console.log('--------------------------------------------------');
  } catch (error) {
    console.error('Error seeding master data:', error.message);
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

    // Seed master data (Location, Division, Department)
    await seedMasterData();

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
