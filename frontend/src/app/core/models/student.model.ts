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
  emergency_contact_relation?: string;
  emergency_contact_phone?: string;
  height_cm?: number;
  weight_kg?: number;
  bmi?: number;
  bmi_category?: string;
  is_active: boolean;
  created_at?: string;
  last_physical_update?: string;
  // Relationships
  user?: any;
  medical_history?: any;
  allergies?: any[];
  medical_visits?: any[];
}
