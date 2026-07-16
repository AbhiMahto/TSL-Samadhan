const mongoose = require('mongoose');

const TimelineSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  updatedBy: {
    emp_id: String,
    name: String,
    email: String,
    role: String
  },
  remarks: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const RequestSchema = new mongoose.Schema(
  {
    requestNo: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    employeeDetails: {
      emp_id: { type: String, required: true },
      name: { type: String, required: true },
      email: { type: String, required: true }
    },
    natureOfItems: {
      type: String,
      required: true
    },
    areaDetails: {
      location: { type: String, required: true },
      locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
      division: { type: String, required: true },
      divisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Division', required: true },
      department: { type: String, required: true },
      departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
      pickupLocation: { type: String, required: true }
    },
    contactDetails: {
      contactPerson: { type: String, required: true },
      contactNumber: { type: String, required: true },
      userDept: { type: String, required: true }
    },
    approverDetails: {
      approverPNo: { type: String, required: true },
      approverMailId: { type: String, required: true }
    },
    materialDetails: {
      itemType: { type: String, required: true },
      itemCategory: { type: String, required: true },
      hazardousItems: { type: String, default: 'No' },
      umc: { type: String, default: '' },
      umcRemarks: { type: String, default: '' },
      alloyType: { type: String, default: 'None' },
      itemDescription: { type: String, required: true },
      quantity: { type: String, required: true },
      uom: { type: String, required: true },
      weight: { type: String, required: true },
      remarks: { type: String, default: '' },
      reason: { type: String, required: true }
    },
    attachments: {
      attachment1: {
        name: String,
        uri: String,
        mimeType: String,
        size: Number
      },
      attachment2: {
        name: String,
        uri: String,
        mimeType: String,
        size: Number
      },
      attachment3: {
        name: String,
        uri: String,
        mimeType: String,
        size: Number
      }
    },
    liftingDate: {
      type: String,
      default: null
    },
    doNo: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['pending_approver', 'pending_ibmd', 'pending_sales', 'closed', 'rejected'],
      default: 'pending_approver',
      index: true
    },
    timeline: [TimelineSchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Request', RequestSchema);
