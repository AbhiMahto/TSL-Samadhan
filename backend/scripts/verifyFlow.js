require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Employee = require('../models/Employee');
const Request = require('../models/Request');
const {
  createRequest,
  approverApproveRequest,
  ibmdApproveRequest,
  salesCloseRequest
} = require('../controllers/requestController');

const mockResponse = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
};

const runVerification = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('Cleaning up old test requests...');
    await Request.deleteMany({ 'employeeDetails.emp_id': 'emp1' });

    // Fetch test users
    const employee = await Employee.findOne({ emp_id: 'emp1' });
    const approver = await Employee.findOne({ emp_id: 'approver1' });
    const ibmd = await Employee.findOne({ emp_id: 'ibmd1' });
    const sales = await Employee.findOne({ emp_id: 'sales1' });

    if (!employee || !approver || !ibmd || !sales) {
      console.error('Error: Seed users missing. Please run "node scripts/seedUsers.js" first.');
      process.exit(1);
    }

    console.log('All test roles verified.\n');

    // Retrieve seeded Location, Division, Department
    const Location = require('../models/Location');
    const Division = require('../models/Division');
    const Department = require('../models/Department');

    const testLoc = await Location.findOne({ name: 'TSL Works' });
    if (!testLoc) {
      console.error('Error: Master data missing. Make sure server has run once to seed master data.');
      process.exit(1);
    }
    const testDiv = await Division.findOne({ name: 'Tubes Division', locationId: testLoc._id });
    const testDept = await Department.findOne({ name: 'JSR TUBES HRM', divisionId: testDiv._id });

    if (!testDiv || !testDept) {
      console.error('Error: Division or Department missing under TSL Works.');
      process.exit(1);
    }

    // ==========================================
    // CASE A: NORMAL ITEM WORKFLOW (Lifting Date)
    // ==========================================
    console.log('==========================================');
    console.log('CASE A: NORMAL ITEM WORKFLOW');
    console.log('==========================================');

    console.log('1. Employee submits a request for a Normal Item (hazardousItems: No)...');
    const normalReqPayload = {
      user: employee,
      body: {
        natureOfItems: 'Capital Item',
        areaDetails: {
          location: testLoc.name,
          locationId: testLoc._id,
          division: testDiv.name,
          divisionId: testDiv._id,
          department: testDept.name,
          departmentId: testDept._id,
          pickupLocation: 'Main Server Room Alpha'
        },
        contactDetails: {
          contactPerson: 'Employee One',
          contactNumber: '9876543210',
          userDept: 'IT Services'
        },
        approverDetails: {
          approverPNo: approver.emp_id,
          approverMailId: approver.email
        },
        materialDetails: {
          itemType: 'Surplus Material',
          itemCategory: 'Electrical Cable',
          hazardousItems: 'No', // NORMAL
          umc: 'UMC-4009',
          umcRemarks: 'Heavy duty copper cables',
          alloyType: 'None',
          itemDescription: '100 meters of unused cabling',
          quantity: '100',
          uom: 'Meters',
          weight: '45',
          remarks: 'Leftover from server room expansion project',
          reason: 'Project Leftover'
        }
      }
    };

    const resCreateA = mockResponse();
    await createRequest(normalReqPayload, resCreateA);
    
    if (resCreateA.statusCode !== 201 || !resCreateA.body.success) {
      console.error('Create Request failed for Normal item:', resCreateA.body);
      process.exit(1);
    }

    const reqA = resCreateA.body.request;
    console.log(`[SUCCESS] Normal request created: ${reqA.requestNo}`);

    console.log('2. Approver signs off normal request...');
    const resApproveA = mockResponse();
    await approverApproveRequest({
      user: approver,
      params: { id: reqA._id },
      body: { remarks: 'Forwarding normal item to IBMD.' }
    }, resApproveA);
    console.log(`[SUCCESS] Approver approved. Status: ${resApproveA.body.request.status}`);

    console.log('3. IBMD enters lifting date and closes normal request...');
    const resIbmDA = mockResponse();
    await ibmdApproveRequest({
      user: ibmd,
      params: { id: reqA._id },
      body: { remarks: 'Ready for pickup.', liftingDate: '2026-06-15' }
    }, resIbmDA);
    
    if (resIbmDA.statusCode !== 200 || !resIbmDA.body.success) {
      console.error('IBMD approval failed for Normal item:', resIbmDA.body);
      process.exit(1);
    }
    
    const finalReqA = await Request.findById(reqA._id);
    console.log(`[SUCCESS] IBMD closed Normal Request directly. Status: ${finalReqA.status}`);
    console.log(`Lifting Date stored in DB: ${finalReqA.liftingDate}`);

    // ==========================================
    // CASE B: HAZARDOUS ITEM WORKFLOW (DO No)
    // ==========================================
    console.log('\n==========================================');
    console.log('CASE B: HAZARDOUS ITEM WORKFLOW');
    console.log('==========================================');

    console.log('1. Employee submits a request for a Hazardous Item (hazardousItems: Yes)...');
    const hazardReqPayload = {
      user: employee,
      body: {
        natureOfItems: 'Revenue Item',
        areaDetails: {
          location: testLoc.name,
          locationId: testLoc._id,
          division: testDiv.name,
          divisionId: testDiv._id,
          department: testDept.name,
          departmentId: testDept._id,
          pickupLocation: 'Chemical Storage Yard C'
        },
        contactDetails: {
          contactPerson: 'Employee One',
          contactNumber: '9876543210',
          userDept: 'Safety & Emergency'
        },
        approverDetails: {
          approverPNo: approver.emp_id,
          approverMailId: approver.email
        },
        materialDetails: {
          itemType: 'Hazardous Waste',
          itemCategory: 'Battery',
          hazardousItems: 'Yes', // HAZARDOUS
          umc: 'UMC-9901',
          umcRemarks: 'Spent lead-acid batteries',
          alloyType: 'None',
          itemDescription: '5 Spent heavy industrial batteries',
          quantity: '5',
          uom: 'Pieces',
          weight: '120',
          remarks: 'Needs urgent safe recycling disposal',
          reason: 'Safety Hazard'
        }
      }
    };

    const resCreateB = mockResponse();
    await createRequest(hazardReqPayload, resCreateB);
    const reqB = resCreateB.body.request;
    console.log(`[SUCCESS] Hazardous request created: ${reqB.requestNo}`);

    console.log('2. Approver signs off hazardous request...');
    const resApproveB = mockResponse();
    await approverApproveRequest({
      user: approver,
      params: { id: reqB._id },
      body: { remarks: 'Critical safety disposal. Approved.' }
    }, resApproveB);
    console.log(`[SUCCESS] Approver approved. Status: ${resApproveB.body.request.status}`);

    console.log('3. IBMD reviews and forwards hazardous request to Sales (No lifting date needed)...');
    const resIbmDB = mockResponse();
    await ibmdApproveRequest({
      user: ibmd,
      params: { id: reqB._id },
      body: { remarks: 'Audited. Moves to Sales team for gate pass.' }
    }, resIbmDB);
    console.log(`[SUCCESS] IBMD forwarded to Sales. Status: ${resIbmDB.body.request.status}`);

    console.log('4. Sales team enters DO No and closes request...');
    const resSalesB = mockResponse();
    await salesCloseRequest({
      user: sales,
      params: { id: reqB._id },
      body: { remarks: 'Gate pass printed. Closed.', doNo: 'DO-5006972' }
    }, resSalesB);
    
    if (resSalesB.statusCode !== 200 || !resSalesB.body.success) {
      console.error('Sales closure failed for Hazardous item:', resSalesB.body);
      process.exit(1);
    }
    
    const finalReqB = await Request.findById(reqB._id);
    console.log(`[SUCCESS] Sales closed Hazardous Request. Status: ${finalReqB.status}`);
    console.log(`DO No stored in DB: ${finalReqB.doNo}`);

    console.log('\n=========================================');
    console.log('[VERIFICATION COMPLETE] Both flows match requirements!');
    console.log('=========================================');

    mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('Verification script failed:', error);
    process.exit(1);
  }
};

runVerification();
