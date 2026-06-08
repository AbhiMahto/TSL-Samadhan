export interface Employee {
  _id: string;
  emp_id: string;
  name: string;
  phone: string;
  email: string;
  department: string;
  designation: string;
  role: 'employee' | 'admin';
  firstLogin: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
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
