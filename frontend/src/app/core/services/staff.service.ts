import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
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
  notes: string;
}

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  constructor(private http: HttpClient) {}

  getStaffDashboard(userId?: number): Observable<any> {
    const suffix = userId ? `?user_id=${userId}` : '';
    return this.http.get<any>(`${environment.legacyApiUrl}/get-staff-dashboard.php${suffix}`);
  }

  updateStaffProfile(userId: number, profileData: any): Observable<any> {
    return this.http.put<any>(`${environment.legacyApiUrl}/update-staff-profile.php`, {
      user_id: userId,
      ...profileData
    });
  }

  getAllStudents(filters: { grade?: number; section?: string; search?: string } = {}): Observable<any> {
    let params = new HttpParams();

    if (filters.grade) {
      params = params.set('grade', String(filters.grade));
    }
    if (filters.section) {
      params = params.set('section', filters.section);
    }
    if (filters.search) {
      params = params.set('search', filters.search);
    }

    return this.http.get<any>(`${environment.apiUrl}/staff/students`, { params }).pipe(
      catchError(() => this.http.get<any>(`${environment.legacyApiUrl}/get-all-students.php`, { params }))
    );
  }

  getStudentProfile(studentId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/students/${studentId}`).pipe(
      catchError(() => this.http.get<any>(`${environment.legacyApiUrl}/get-student-complete-profile.php?student_id=${studentId}`))
    );
  }

  getReportsData(startDate: string, endDate: string, gradeFilter?: string): Observable<any> {
    let params = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate);

    if (gradeFilter) {
      params = params.set('grade_level', gradeFilter);
    }

    return this.http.get<any>(`${environment.apiUrl}/dashboard/clinic/overview`, { params }).pipe(
      catchError(() => this.http.get<any>(`${environment.legacyApiUrl}/get-reports-data.php?type=medical`, { params }))
    );
  }

  getSections(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/staff/sections`).pipe(
      map((response) => this.normalizeSectionsResponse(response)),
      catchError(() => {
        return this.http.get<any>(`${environment.apiUrl}/sections`).pipe(
          map((response) => this.normalizeSectionsResponse(response)),
          catchError((error) => {
            if (error?.status === 404) {
              return this.http.get<any>(`${environment.apiUrl}/admin/sections`).pipe(
                map((response) => this.normalizeSectionsResponse(response)),
                catchError(() => of({ success: false, data: [] }))
              );
            }

            return of({ success: false, data: [] });
          })
        );
      })
    );
  }

  private normalizeSectionsResponse(response: any): any {
    if (!response?.success) {
      return { success: false, data: [] };
    }

    const payload = response.data;
    if (!Array.isArray(payload)) {
      return { success: true, data: [] };
    }

    const flatSections: any[] = [];

    payload.forEach((item: any) => {
      if (item?.section_name) {
        flatSections.push(item);
        return;
      }

      if (Array.isArray(item?.sections)) {
        item.sections.forEach((section: any) => {
          flatSections.push({
            ...section,
            level_name: item.level_name ?? section.level_name,
            level_number: item.level_number ?? section.level_number,
          });
        });
      }
    });

    return { success: true, data: flatSections };
  }
}
