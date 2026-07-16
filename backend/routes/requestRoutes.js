const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createRequest,
  getMyRequests,
  getPendingRequests,
  approverApproveRequest,
  ibmdApproveRequest,
  salesCloseRequest,
  rejectRequest,
  getActionHistory
} = require('../controllers/requestController');

const router = express.Router();

// Submit a new request (authenticated users)
router.post('/', protect, createRequest);

// Retrieve requests submitted by the logged-in employee
router.get('/my-requests', protect, getMyRequests);

// Retrieve pending requests for the logged-in workflow role
router.get('/pending', protect, getPendingRequests);

// Retrieve action history for the logged-in workflow role
router.get('/history', protect, getActionHistory);

// Approver approval
router.post('/:id/approver-approve', protect, approverApproveRequest);

// IBMD approval
router.post('/:id/ibmd-approve', protect, ibmdApproveRequest);

// Sales closure
router.post('/:id/sales-close', protect, salesCloseRequest);

// Workflow rejection (Approver, IBMD, Sales)
router.post('/:id/reject', protect, rejectRequest);

module.exports = router;
