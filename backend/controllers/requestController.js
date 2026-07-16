const Request = require('../models/Request');
const Employee = require('../models/Employee');
const { sendWorkflowEmail } = require('../services/emailService');

/**
 * Helper: Generates a sequential request number for today
 * Format: ORYYYYMMDD0001, ORYYYYMMDD0002...
 */
const generateRequestNumber = async () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const date = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${date}`; // "YYYYMMDD"
  const prefix = `OR${dateStr}`;

  // Find the request with the highest sequence number for today
  const lastRequest = await Request.findOne({
    requestNo: new RegExp(`^${prefix}`)
  }).sort({ requestNo: -1 });

  let sequence = 1;
  if (lastRequest) {
    // Extract the counter (last 4 characters)
    const lastSeqStr = lastRequest.requestNo.slice(prefix.length);
    const lastSeq = parseInt(lastSeqStr, 10);
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }

  const seqStr = String(sequence).padStart(4, '0');
  return `${prefix}${seqStr}`;
};

/**
 * @desc    Submit a new gate pass request
 * @route   POST /api/requests
 * @access  Private (Employee role)
 */
const createRequest = async (req, res) => {
  try {
    const {
      natureOfItems,
      areaDetails,
      contactDetails,
      approverDetails,
      materialDetails,
      attachments
    } = req.body;

    // 1. Validations
    if (!natureOfItems) {
      return res.status(400).json({ success: false, message: 'Nature of Items is required.' });
    }
    if (!areaDetails || !areaDetails.location || !areaDetails.locationId || !areaDetails.division || !areaDetails.divisionId || !areaDetails.department || !areaDetails.departmentId || !areaDetails.pickupLocation) {
      return res.status(400).json({ success: false, message: 'All area details (location, locationId, division, divisionId, department, departmentId, pickupLocation) are required.' });
    }
    if (!contactDetails || !contactDetails.contactPerson || !contactDetails.contactNumber || !contactDetails.userDept) {
      return res.status(400).json({ success: false, message: 'All contact details (contactPerson, contactNumber, userDept) are required.' });
    }
    if (!approverDetails || !approverDetails.approverPNo || !approverDetails.approverMailId) {
      return res.status(400).json({ success: false, message: 'Approver PNo and email are required.' });
    }
    if (!materialDetails || !materialDetails.itemType || !materialDetails.itemCategory || !materialDetails.itemDescription || !materialDetails.quantity || !materialDetails.uom || !materialDetails.weight || !materialDetails.reason) {
      return res.status(400).json({ success: false, message: 'All required material details must be completed.' });
    }

    // 2. Generation of Request Number
    const requestNo = await generateRequestNumber();

    // 3. Create JSON document
    const requestDoc = new Request({
      requestNo,
      employeeId: req.user._id,
      employeeDetails: {
        emp_id: req.user.emp_id,
        name: req.user.name,
        email: req.user.email
      },
      natureOfItems,
      areaDetails,
      contactDetails,
      approverDetails,
      materialDetails,
      attachments: attachments || {},
      status: 'pending_approver',
      timeline: [
        {
          status: 'pending_approver',
          updatedBy: {
            emp_id: req.user.emp_id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
          },
          remarks: 'Gate Pass Request Submitted.'
        }
      ]
    });

    // 4. Insert into collection (Save)
    const savedRequest = await requestDoc.save();

    // 5. Trigger email notification to the Approver
    const approverEmail = approverDetails.approverMailId;
    const emailSubject = `Pending Approval: Gate Pass Request ${requestNo}`;
    const emailText = `Dear Approver,

A new Gate Pass Request ${requestNo} has been submitted by Employee ${req.user.name} (${req.user.emp_id}) and requires your review.

Details:
- Nature of Items: ${natureOfItems}
- Location: ${areaDetails.location}
- Item Type: ${materialDetails.itemType}
- Description: ${materialDetails.itemDescription}

Please log in to the Samadhan Portal and act on this request.

Regards,
Tata Steel Samadhan System`;

    await sendWorkflowEmail({
      to: approverEmail,
      subject: emailSubject,
      text: emailText
    });

    return res.status(201).json({
      success: true,
      message: `Request ${requestNo} submitted successfully.`,
      request: savedRequest
    });

  } catch (error) {
    console.error('Create Request Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit request due to server error.'
    });
  }
};

/**
 * @desc    Get requests submitted by the logged-in employee
 * @route   GET /api/requests/my-requests
 * @access  Private (Employee role)
 */
const getMyRequests = async (req, res) => {
  try {
    const requests = await Request.find({ employeeId: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error('Get My Requests Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch requests.'
    });
  }
};

/**
 * @desc    Get pending requests for current user based on their workflow role
 * @route   GET /api/requests/pending
 * @access  Private (Approver, IBMD, Sales roles)
 */
const getPendingRequests = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userEmail = req.user.email.toLowerCase().trim();
    let query = {};

    if (userRole === 'approver') {
      // Find requests pending approver and matched by approver email
      query = {
        status: 'pending_approver',
        'approverDetails.approverMailId': new RegExp(`^${userEmail}$`, 'i')
      };
    } else if (userRole === 'ibmd') {
      // Find requests approved by approver and pending IBMD
      query = { status: 'pending_ibmd' };
    } else if (userRole === 'sales') {
      // Find requests approved by IBMD and pending Sales close
      query = { status: 'pending_sales' };
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to view pending workflow items.'
      });
    }

    const requests = await Request.find(query).sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error('Get Pending Requests Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve pending requests.'
    });
  }
};

/**
 * @desc    Approver Action: Approve and route to IBMD
 * @route   POST /api/requests/:id/approver-approve
 * @access  Private (Approver role)
 */
const approverApproveRequest = async (req, res) => {
  try {
    const { remarks } = req.body;
    const request = await Request.findById(req.id || req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (request.status !== 'pending_approver') {
      return res.status(400).json({ success: false, message: 'Request is not in pending approver state.' });
    }

    // Verify user email matches designated approver email
    const approverEmail = request.approverDetails.approverMailId.toLowerCase().trim();
    const userEmail = req.user.email.toLowerCase().trim();
    if (approverEmail !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not the designated approver for this request.'
      });
    }

    // Update workflow inside same document
    request.status = 'pending_ibmd';
    request.timeline.push({
      status: 'pending_ibmd',
      updatedBy: {
        emp_id: req.user.emp_id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      },
      remarks: remarks || 'Approved by Approver. Routed to IBMD.'
    });

    await request.save();

    // Trigger email notification to IBMD users
    // Try to find IBMD users in the DB
    const ibmdUsers = await Employee.find({ role: 'ibmd', status: 'active' });
    const ibmdEmails = ibmdUsers.map(u => u.email).filter(Boolean);
    const targetEmail = ibmdEmails.length > 0 ? ibmdEmails.join(', ') : 'ibmd-approvals@tatasteel.com';

    const emailSubject = `Pending IBMD Action: Gate Pass Request ${request.requestNo}`;
    const emailText = `Dear IBMD Team,

Gate Pass Request ${request.requestNo} has been approved by ${req.user.name} and is now pending your review.

Details:
- Submitted by: ${request.employeeDetails.name}
- Nature of Items: ${request.natureOfItems}
- Approver Remarks: ${remarks || 'Approved'}

Please log in to the portal and act on this request.

Regards,
Tata Steel Samadhan System`;

    await sendWorkflowEmail({
      to: targetEmail,
      subject: emailSubject,
      text: emailText
    });

    return res.status(200).json({
      success: true,
      message: 'Request approved and forwarded to IBMD.',
      request
    });

  } catch (error) {
    console.error('Approver Approve Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process approval.'
    });
  }
};

/**
 * @desc    IBMD Action: Approve and route to Sales
 * @route   POST /api/requests/:id/ibmd-approve
 * @access  Private (IBMD role)
 */
const ibmdApproveRequest = async (req, res) => {
  try {
    const { remarks, liftingDate } = req.body;
    const request = await Request.findById(req.id || req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (request.status !== 'pending_ibmd') {
      return res.status(400).json({ success: false, message: 'Request is not in pending IBMD state.' });
    }

    const isHazardous = request.materialDetails.hazardousItems === 'Yes';

    if (isHazardous) {
      // 1. Hazard Category -> moves to Sales
      request.status = 'pending_sales';
      request.timeline.push({
        status: 'pending_sales',
        updatedBy: {
          emp_id: req.user.emp_id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role
        },
        remarks: remarks || 'Approved by IBMD (Hazard Category). Routed to Sales for closure.'
      });

      await request.save();

      // Trigger email notification to Sales users
      const salesUsers = await Employee.find({ role: 'sales', status: 'active' });
      const salesEmails = salesUsers.map(u => u.email).filter(Boolean);
      const targetEmail = salesEmails.length > 0 ? salesEmails.join(', ') : 'sales-closure@tatasteel.com';

      const emailSubject = `Pending Sales Close: Gate Pass Request ${request.requestNo}`;
      const emailText = `Dear Sales Team,

Gate Pass Request ${request.requestNo} (Hazard Category) has been approved by IBMD (${req.user.name}) and is pending Sales closure.

Details:
- Submitted by: ${request.employeeDetails.name}
- Item Description: ${request.materialDetails.itemDescription}
- IBMD Remarks: ${remarks || 'Approved'}

Please log in to the portal, enter the DO No, and perform the final closure action.

Regards,
Tata Steel Samadhan System`;

      await sendWorkflowEmail({
        to: targetEmail,
        subject: emailSubject,
        text: emailText
      });

      return res.status(200).json({
        success: true,
        message: 'Request approved by IBMD (Hazard Category) and forwarded to Sales.',
        request
      });
    } else {
      // 2. Normal Item -> IBMD enters lifting date and closes directly
      if (!liftingDate) {
        return res.status(400).json({
          success: false,
          message: 'Lifting date is required to approve and close a normal item request.'
        });
      }

      request.liftingDate = liftingDate;
      request.status = 'closed';
      request.timeline.push({
        status: 'closed',
        updatedBy: {
          emp_id: req.user.emp_id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role
        },
        remarks: remarks || `Approved and closed by IBMD. Lifting date scheduled for: ${liftingDate}.`
      });

      await request.save();

      // Trigger email directly to Employee
      const employeeEmail = request.employeeDetails.email;
      const emailSubject = `Request Closed: Gate Pass Request ${request.requestNo}`;
      const emailText = `Dear ${request.employeeDetails.name},

Your Gate Pass Request ${request.requestNo} (Normal Item) has been successfully approved and closed by the IBMD department (${req.user.name}).

Lifting Date: ${liftingDate}
IBMD Remarks: ${remarks || 'Closed'}

You can now download/print your gate pass.

Regards,
Tata Steel Samadhan System`;

      await sendWorkflowEmail({
        to: employeeEmail,
        subject: emailSubject,
        text: emailText
      });

      return res.status(200).json({
        success: true,
        message: 'Normal item request approved and successfully closed by IBMD.',
        request
      });
    }

  } catch (error) {
    console.error('IBMD Approve Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process IBMD action.'
    });
  }
};

/**
 * @desc    Sales Action: Close request
 * @route   POST /api/requests/:id/sales-close
 * @access  Private (Sales role)
 */
const salesCloseRequest = async (req, res) => {
  try {
    const { remarks, doNo } = req.body;

    if (!doNo) {
      return res.status(400).json({
        success: false,
        message: 'DO No (Delivery Order Number) is required to close a sales request.'
      });
    }

    const request = await Request.findById(req.id || req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (request.status !== 'pending_sales') {
      return res.status(400).json({ success: false, message: 'Request is not in pending Sales state.' });
    }

    // Update workflow
    request.doNo = doNo;
    request.status = 'closed';
    request.timeline.push({
      status: 'closed',
      updatedBy: {
        emp_id: req.user.emp_id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      },
      remarks: remarks || `Request closed by Sales. DO No registered: ${doNo}.`
    });

    await request.save();

    // Trigger email notification to Employee
    const employeeEmail = request.employeeDetails.email;
    const emailSubject = `Request Closed: Gate Pass Request ${request.requestNo}`;
    const emailText = `Dear ${request.employeeDetails.name},

Your Gate Pass Request ${request.requestNo} (Hazard Category) has been successfully closed by the Sales department (${req.user.name}).

DO No: ${doNo}
Remarks: ${remarks || 'Closed'}

You can now download/print your gate pass.

Regards,
Tata Steel Samadhan System`;

    await sendWorkflowEmail({
      to: employeeEmail,
      subject: emailSubject,
      text: emailText
    });

    return res.status(200).json({
      success: true,
      message: 'Request successfully closed by Sales.',
      request
    });

  } catch (error) {
    console.error('Sales Close Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to close request.'
    });
  }
};

/**
 * @desc    Workflow Reject Action (Usable by Approver, IBMD, Sales)
 * @route   POST /api/requests/:id/reject
 * @access  Private
 */
const rejectRequest = async (req, res) => {
  try {
    const { remarks } = req.body;
    if (!remarks) {
      return res.status(400).json({ success: false, message: 'Remarks are required for rejection.' });
    }

    const request = await Request.findById(req.id || req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    // Validate that the request can be rejected (is in a pending state)
    const activeStates = ['pending_approver', 'pending_ibmd', 'pending_sales'];
    if (!activeStates.includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: `Request cannot be rejected from status: ${request.status}`
      });
    }

    // Check approver specific security
    if (request.status === 'pending_approver') {
      const approverEmail = request.approverDetails.approverMailId.toLowerCase().trim();
      const userEmail = req.user.email.toLowerCase().trim();
      if (approverEmail !== userEmail) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not the designated approver for this request.'
        });
      }
    }

    const previousStatus = request.status;

    // Update workflow
    request.status = 'rejected';
    request.timeline.push({
      status: 'rejected',
      updatedBy: {
        emp_id: req.user.emp_id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      },
      remarks
    });

    await request.save();

    // Trigger email notification to Employee
    const employeeEmail = request.employeeDetails.email;
    const emailSubject = `Request Rejected: Gate Pass Request ${request.requestNo}`;
    const emailText = `Dear ${request.employeeDetails.name},

Your Gate Pass Request ${request.requestNo} has been rejected at the state "${previousStatus}" by ${req.user.name} (${req.user.role}).

Reason / Remarks:
${remarks}

Please correct your request details and submit a new request if necessary.

Regards,
Tata Steel Samadhan System`;

    await sendWorkflowEmail({
      to: employeeEmail,
      subject: emailSubject,
      text: emailText
    });

    return res.status(200).json({
      success: true,
      message: 'Request successfully rejected.',
      request
    });

  } catch (error) {
    console.error('Reject Request Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject request.'
    });
  }
};

/**
 * @desc    Get requests acted-on (approved/rejected/closed) by the logged-in user
 * @route   GET /api/requests/history
 * @access  Private
 */
const getActionHistory = async (req, res) => {
  try {
    const userId = req.user.emp_id;

    // Find all requests where this user has performed an action recorded in the timeline
    const requests = await Request.find({
      'timeline.updatedBy.emp_id': userId
    }).sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error('Get Action History Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve action history.'
    });
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getPendingRequests,
  approverApproveRequest,
  ibmdApproveRequest,
  salesCloseRequest,
  rejectRequest,
  getActionHistory
};
