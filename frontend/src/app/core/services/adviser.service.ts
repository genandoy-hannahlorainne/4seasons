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
  name: string;
  student_number: string;
  grade_level: string;
  section: string;
  gender: string;
  blood_type: string;
  status: string;
  last_visit: string;
  allergy_count: number;
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
    return this.http.post<any>(`${environment.apiUrl}/get-adviser-dashboard.php`, {
      user_id: userId
    });
  }
}
