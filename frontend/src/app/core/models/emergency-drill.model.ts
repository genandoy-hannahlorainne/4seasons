export interface EmergencyDrill {
  id: number;
  drill_name: string;
  drill_type: 'earthquake' | 'fire' | 'lockdown' | 'medical' | 'evacuation';
  description?: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  duration_seconds?: number;
  created_by: number;
  settings?: any;
  statistics?: DrillStatistics;
  created_at: string;
  updated_at: string;
  creator?: any;
  participants?: DrillParticipant[];
  scans?: DrillScan[];
}

export interface DrillParticipant {
  id: number;
  drill_id: number;
  student_id: number;
  role: 'injured' | 'rescuer' | 'observer' | 'evacuee';
  status: 'assigned' | 'scanned' | 'rescued';
  injury_simulation?: string;
  severity?: 'minor' | 'moderate' | 'severe' | 'critical';
  assigned_at?: string;
  first_scan_at?: string;
  rescued_at?: string;
  response_time_seconds?: number;
  rescuer_id?: number;
  scan_history?: any[];
  student?: any;
  rescuer?: any;
}

export interface DrillScan {
  id: number;
  drill_id: number;
  participant_id: number;
  scanned_by: number;
  scan_type: 'qr' | 'manual' | 'nfc';
  scanned_at: string;
  seconds_from_start: number;
  location?: string;
  notes?: string;
  metadata?: any;
  participant?: DrillParticipant;
  scanner?: any;
}

export interface DrillStatistics {
  total_participants: number;
  injured_participants: number;
  rescuer_participants: number;
  scanned_participants: number;
  rescued_participants: number;
  average_response_time?: number;
  fastest_response?: number;
  slowest_response?: number;
  total_scans: number;
  completion_rate: number;
}

export interface DrillDashboard {
  drill_status: string;
  elapsed_time: number;
  total_participants: number;
  injured_count: number;
  scanned_count: number;
  rescued_count: number;
  average_response_time?: number;
  fastest_response?: number;
  slowest_response?: number;
  recent_scans: DrillScan[];
}

export interface CreateDrillRequest {
  drill_name: string;
  drill_type: string;
  description?: string;
  scheduled_at?: string;
  settings?: any;
}

export interface AddParticipantsRequest {
  participants: {
    student_id: number;
    role: string;
    injury_simulation?: string;
    severity?: string;
  }[];
}

export interface ScanParticipantRequest {
  student_id: number;
  scan_type?: string;
  location?: any;
  notes?: string;
}