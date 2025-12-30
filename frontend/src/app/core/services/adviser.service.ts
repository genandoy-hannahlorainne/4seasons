import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdviserDashboardData {
  adviser: {
    adviser_id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    employee_number: string;
    contact_phone: string;
    username: string;
    email: string;
  };
  statistics: {
    total_students: number;
    students_with_visits: number;
    students_with_allergies: number;
    pending_visits: number;
  };
  students: AdvisedStudent[];
  recent_visits: RecentVisit[];
}

export interface AdvisedStudent {
  student_id: number;
  student_number: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  full_name: string;
  birth_date: string;
  gender: string;
  grade_level: string;
  section: string;
  grade_section: string;
  blood_type: string;
  emergency_contact: string;
  email: string;
  phone: string;
  allergies: string[];
  last_visit: {
    visit_id: number;
    visit_date: string;
    reason: string;
    diagnosis: string;
    treatment: string;
    status: string;
  } | null;
}

export interface AdvisoryStudentsResponse {
  success: boolean;
  adviser: {
    adviser_id: number;
    name: string;
    grade_level: string;
    section: string;
    advisory_class: string;
  };
  students: AdvisedStudent[];
  stats: {
    total_students: number;
    clinic_visits_this_month: number;
    students_with_allergies: number;
  };
}

export interface RecentVisit {
  visit_id: number;
  visit_datetime: string;
  visit_date: string;
  visit_time: string;
  visit_type: string;
  chief_complaint: string;
  status: string;
  student_name: string;
  student_number: string;
  grade_level: string;
  section: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdviserService {
  constructor(private http: HttpClient) {}

  getAdviserDashboard(userId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/get-adviser-dashboard.php?user_id=${userId}`);
  }

  getAdvisoryStudents(userId: number): Observable<AdvisoryStudentsResponse> {
    return this.http.get<AdvisoryStudentsResponse>(`${environment.apiUrl}/get-advisory-students.php?user_id=${userId}`);
  }
}
