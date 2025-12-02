export interface MedicalVisit {
  visit_id: number;
  student_id: number;
  clinic_staff_id?: number;
  visit_datetime: string;
  visit_type: 'Routine' | 'Emergency' | 'Follow-up' | 'Referral';
  chief_complaint?: string;
  notes?: string;
  status: 'Open' | 'Closed' | 'Referred';
}

export interface Vitals {
  vitals_id: number;
  visit_id: number;
  recorded_at: string;
  weight_kg?: number;
  height_cm?: number;
  temperature_c?: number;
  bp_systolic?: number;
  bp_diastolic?: number;
  pulse_rate?: number;
  respiration_rate?: number;
  notes?: string;
  bmi?: number;
  bmi_category?: string;
}

export interface Diagnosis {
  diagnosis_id: number;
  visit_id: number;
  icd_code?: string;
  diagnosis_text?: string;
}

export interface Medication {
  med_id: number;
  visit_id: number;
  medication_name?: string;
  dosage?: string;
  route?: string;
  frequency?: string;
  duration?: string;
  notes?: string;
}
