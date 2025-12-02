export interface User {
  user_id: number;
  role_id: number;
  username: string;
  email?: string;
  phone?: string;
  full_name?: string;
  is_active: boolean;
}

export interface Role {
  role_id: number;
  role_name: string;
}
