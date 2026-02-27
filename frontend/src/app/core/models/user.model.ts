export interface User {
  user_id: number;
  role_id: number;
  role_name: string;
  username: string;
  email?: string;
  phone?: string;
  full_name?: string;
  is_active?: boolean;
  password_must_change?: boolean;
  
  // Role-specific information from Laravel API
  admin_info?: {
    is_admin: boolean;
  };
  student_info?: {
    student_id: number;
    student_number: string;
    first_name: string;
    last_name: string;
  };
  adviser_info?: {
    adviser_id: number;
    employee_id: string;
    contact_phone?: string;
  };
  staff_info?: {
    clinic_staff_id: number;
    staff_id: string;
    position?: string;
  };
  
  // Legacy fields (for backward compatibility)
  advisory_class?: string;
}

export interface Role {
  role_id: number;
  role_name: string;
}

// Laravel API response interfaces
export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    token_type: string;
    expires_in: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: any;
}
