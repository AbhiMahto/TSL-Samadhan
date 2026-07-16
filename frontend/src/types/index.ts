export interface Employee {
  _id: string;
  emp_id: string;
  name: string;
  phone: string;
  email: string;
  department: string;
  designation: string;
  role: 'employee' | 'admin' | 'approver' | 'ibmd' | 'sales';
  firstLogin: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface GatePassRequest {
  _id: string;
  requestNo: string;
  employeeId: string;
  employeeDetails: {
    emp_id: string;
    name: string;
    email: string;
  };
  natureOfItems: string;
  areaDetails: {
    location: string;
    division: string;
    department: string;
    pickupLocation: string;
  };
  contactDetails: {
    contactPerson: string;
    contactNumber: string;
    userDept: string;
  };
  approverDetails: {
    approverPNo: string;
    approverMailId: string;
  };
  materialDetails: {
    itemType: string;
    itemCategory: string;
    hazardousItems: string;
    umc: string;
    umcRemarks: string;
    alloyType: string;
    itemDescription: string;
    quantity: string;
    uom: string;
    weight: string;
    remarks: string;
    reason: string;
  };
  attachments: {
    attachment1?: { name: string; uri: string; mimeType: string; size: number };
    attachment2?: { name: string; uri: string; mimeType: string; size: number };
    attachment3?: { name: string; uri: string; mimeType: string; size: number };
  };
  status: 'pending_approver' | 'pending_ibmd' | 'pending_sales' | 'closed' | 'rejected';
  timeline: Array<{
    status: string;
    updatedBy: {
      emp_id: string;
      name: string;
      email: string;
      role: string;
    };
    remarks: string;
    timestamp: string;
    _id: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: Employee;
  message?: string;
}

export interface OtpResponse {
  success: boolean;
  sessionInfo: string;
  phone: string;
  message: string;
  mockOtp?: string;
  isMock?: boolean;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  verificationToken: string;
}
