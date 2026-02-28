import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/user.model';

export interface AdminDashboardStats {
  total_users: number;
  total_students: number;
  total_advisers: number;
  total_staff: number;
  total_visits: number;
  emergency_visits: number;
  visits_today: number;
  visits_this_week: number;
  students_with_allergies: number;
  students_with_conditions: number;
  recent_visits: any[];
  visits_by_day: { date: string; count: number }[];
  visits_by_type: { [key: string]: number };
  grade_distribution: { [key: string]: number };
}

export interface AdviserDashboardStats {
  total_students: number;
  students_with_allergies: number;
  students_with_conditions: number;
  recent_visits: number;
  emergency_visits: number;
  students_needing_attention: number;
  grade_sections: { [grade: string]: { [section: string]: number } };
  recent_student_visits: any[];
}

export interface StaffDashboardStats {
  total_visits_handled: number;
  visits_today: number;
  emergency_visits_handled: number;
  pending_visits: number;
  recent_visits: any[];
  frequent_visitors: any[];
  visits_by_type: { [key: string]: number };
  daily_visits: { date: string; count: number }[];
}

export interface StudentDashboardStats {
  student_info: {
    student_id: number;
    student_number: string;
    full_name: string;
    grade_level: string;
    section: string;
    blood_type?: string;
    height_cm?: number;
    weight_kg?: number;
    bmi?: number;
    bmi_category?: string;
  };
  medical_summary: {
    total_visits: number;
    recent_visits: any[];
    allergies: any[];
    medical_history: any;
  };
  health_alerts: {
    has_allergies: boolean;
    has_conditions: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private http: HttpClient) {}

  // Laravel API methods
  getAdminStats(days: number = 30): Observable<AdminDashboardStats> {
    const params = new HttpParams().set('days', days.toString());
    
    return this.http.get<ApiResponse<AdminDashboardStats>>(`${environment.apiUrl}/dashboard/admin/stats`, { params })
      .pipe(map(response => response.data));
  }

  getAdviserStats(days: number = 30): Observable<AdviserDashboardStats> {
    const params = new HttpParams().set('days', days.toString());
    
    return this.http.get<ApiResponse<AdviserDashboardStats>>(`${environment.apiUrl}/dashboard/adviser/stats`, { params })
      .pipe(map(response => response.data));
  }

  getStaffStats(days: number = 30): Observable<StaffDashboardStats> {
    const params = new HttpParams().set('days', days.toString());
    
    return this.http.get<ApiResponse<StaffDashboardStats>>(`${environment.apiUrl}/dashboard/staff/stats`, { params })
      .pipe(map(response => response.data));
  }

  getStudentStats(): Observable<StudentDashboardStats> {
    return this.http.get<ApiResponse<StudentDashboardStats>>(`${environment.apiUrl}/dashboard/student/stats`)
      .pipe(map(response => response.data));
  }

  // Legacy API methods (keep for backward compatibility during migration)
  getAdminDashboardStats(): Observable<any> {
    return this.http.get<any>(`${environment.legacyApiUrl}/get-admin-dashboard-stats.php`);
  }

  getAdviserDashboard(): Observable<any> {
    return this.http.get<any>(`${environment.legacyApiUrl}/get-adviser-dashboard.php`);
  }

  getStaffDashboard(): Observable<any> {
    return this.http.get<any>(`${environment.legacyApiUrl}/get-staff-dashboard.php`);
  }

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${environment.legacyApiUrl}/get-dashboard-stats.php`);
  }
}