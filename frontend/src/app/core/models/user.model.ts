export interface User {
  user_id: number;
  role_id: number;
  role_name: string;
  username: string;
  email?: string;
  phone?: string;
  full_name?: string;
  is_active: boolean;
  student_info?: any;
  adviser_info?: any;
  staff_info?: any;
  advisory_class?: string;
}

export interface Role {
  role_id: number;
  role_name: string;
}
