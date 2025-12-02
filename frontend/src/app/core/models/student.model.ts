export interface Student {
  student_id: number;
  student_number: string;
  user_id?: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  birth_date?: string;
  gender?: 'M' | 'F' | 'Other';
  grade_level?: string;
  section?: string;
  address?: string;
  blood_type?: string;
  emergency_contact?: string;
  is_active: boolean;
}
