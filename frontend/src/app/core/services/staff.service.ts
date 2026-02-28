import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StaffDashboardData {
  staff: {
    clinic_staff_id: number;
    staff_code: string;
    position: string;
    username: string;
    full_name: string;
  };
  statistics: {
    total_students: number;
    fit_for_activities: number;
    pending_assessment: number;
    restricted_activities: number;
    special_medical_needs: number;
  };
  students: StudentHealthRecord[];
}

export interface StudentHealthRecord {
  student_id: number;
  name: string;
  lrn: string;
  grade_level: string;
  section: string;
  status: string;
  last_checkup: string;
  notes: string;
}

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  constructor(private http: HttpClient) {}

  getStaffDashboard(userId: number): Observable<any> {
    return this.http.post<any>(`${environment.legacyApiUrl}/get-staff-dashboard.php`, { user_id: userId });
  }

  getStudentProfile(studentId: number): Observable<any> {
    return this.http.get<any>(`${environment.legacyApiUrl}/get-student-profile.php?student_id=${studentId}`);
  }

  getAllStudents(filters?: { grade?: number; section?: string; search?: string }): Observable<any> {
    let params = new HttpParams();
    
    if (filters?.grade) {
      params = params.set('grade', filters.grade.toString());
    }
    if (filters?.section) {
      params = params.set('section', filters.section);
    }
    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    
    return this.http.get<any>(`${environment.apiUrl}/staff/students`, { params });
  }

  getReportsData(startDate: string, endDate: string, gradeLevel?: string): Observable<any> {
    let url = `${environment.legacyApiUrl}/get-reports-data.php?start_date=${startDate}&end_date=${endDate}`;
    if (gradeLevel) {
      url += `&grade_level=${gradeLevel}`;
    }
    return this.http.get<any>(url);
  }

  // Profile Management
  updateStaffProfile(userId: number, profileData: any): Observable<any> {
    return this.http.put<any>(`${environment.legacyApiUrl}/update-staff-profile.php`, {
      user_id: userId,
      ...profileData
    });
  }

  // Get sections for filtering
  getSections(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/sections`);
  }
}
