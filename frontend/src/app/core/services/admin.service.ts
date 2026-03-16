import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
    updateUser(userId: number, updates: any): Observable<any> {
      return this.http.put<any>(`${environment.apiUrl}/admin/users/${userId}`, updates);
    }

    resetPassword(userId: number, newPassword: string): Observable<any> {
      return this.http.post<any>(`${environment.apiUrl}/admin/users/${userId}/reset-password`, { new_password: newPassword });
    }

    deactivateUser(userId: number): Observable<any> {
      return this.http.post<any>(`${environment.apiUrl}/admin/users/${userId}/deactivate`, {});
    }

    activateUser(userId: number): Observable<any> {
      return this.http.post<any>(`${environment.apiUrl}/admin/users/${userId}/activate`, {});
    }

    deleteUser(userId: number): Observable<any> {
      return this.http.delete<any>(`${environment.apiUrl}/admin/users/${userId}`);
    }

    createUserLegacy(userData: any): Observable<any> {
      // For non-student roles, use Laravel endpoint
      return this.http.post<any>(`${environment.apiUrl}/admin/create-user`, userData);
    }
  constructor(private http: HttpClient) {}

  createUser(userData: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/admin/create-user`, userData);
  }

  getAllUsers(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/get-all-users`);
  }

  getUsersByRole(role: 'student' | 'adviser' | 'faculty' | 'clinic_staff' | 'staff'): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/get-all-users?role=${role}`);
  }

  getSectionsForGrade(gradeLevel: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/school-years/current`).pipe(
      switchMap((schoolYearResponse) => {
        const schoolYearId = schoolYearResponse?.data?.id;
        return this.http.get<any>(`${environment.apiUrl}/admin/sections?school_year_id=${schoolYearId}&grade_level=${gradeLevel}`);
      }),
      catchError(() => {
        return this.http.get<any>(`${environment.apiUrl}/admin/sections?grade_level=${gradeLevel}`);
      })
    );
  }

  getGradeLevelsWithSections(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/grade-levels`);
  }

  // Bulk Import Students (Laravel)
  bulkImportStudents(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('csv_file', file);
    return this.http.post<any>(`${environment.apiUrl}/admin/students/bulk-import`, formData);
  }

  // System Settings (Laravel)
  getSystemSettings(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/system-settings`);
  }

  updateSystemSettings(section: string, settings: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/admin/system-settings`, {
      section,
      settings
    });
  }

  // Reports
  getReport(reportType: string, startDate?: string, endDate?: string): Observable<any> {
    let url = `${environment.apiUrl}/admin/reports?type=${reportType}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    return this.http.get<any>(url);
  }

  getSummaryReport(): Observable<any> {
    return this.getReport('summary');
  }

  getUsersReport(): Observable<any> {
    return this.getReport('users');
  }

  getMedicalReport(startDate?: string, endDate?: string): Observable<any> {
    return this.getReport('medical', startDate, endDate);
  }

  getRegistrationReport(startDate?: string, endDate?: string): Observable<any> {
    return this.getReport('registration', startDate, endDate);
  }

  getAllergiesReport(): Observable<any> {
    return this.getReport('allergies');
  }

  getPrincipalHealthTrendReport(params: {
    startDate?: string;
    endDate?: string;
    year?: number;
    quarter?: number;
    gradeLevel?: string;
  } = {}): Observable<any> {
    let httpParams = new HttpParams();

    if (params.startDate) {
      httpParams = httpParams.set('start_date', params.startDate);
    }
    if (params.endDate) {
      httpParams = httpParams.set('end_date', params.endDate);
    }
    if (params.year) {
      httpParams = httpParams.set('year', String(params.year));
    }
    if (params.quarter) {
      httpParams = httpParams.set('quarter', String(params.quarter));
    }
    if (params.gradeLevel) {
      httpParams = httpParams.set('grade_level', params.gradeLevel);
    }

    return this.http.get<any>(`${environment.apiUrl}/admin/reports/principal-health-trends`, {
      params: httpParams
    });
  }

  // Activity logs
  getActivityLogs(limit: number = 20, offset: number = 0): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/activity-logs?limit=${limit}&offset=${offset}`);
  }

  // Notifications
  getNotifications(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/notifications`);
  }

  markNotificationAsRead(notificationId: number): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/admin/notifications/${notificationId}/read`, {});
  }

  markAllNotificationsAsRead(): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/admin/notifications/mark-all-read`, {});
  }

  deleteNotification(notificationId: number): Observable<any> {
    return this.http.request<any>('DELETE', `${environment.apiUrl}/admin/notifications`, {
      body: { notification_id: notificationId }
    });
  }

  // Send SMS to parent
  sendParentSMS(visitId: number): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/admin/send-parent-sms`, {
      visit_id: visitId
    });
  }

  // Health Risk Visualization
  getHealthRiskVisualization(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/health-risk-visualization`);
  }

  // Health Recommendations (Legacy API)
  getHealthRecommendations(): Observable<any> {
    // For now, return empty recommendations since we don't have this endpoint in legacy API
    return new Observable(observer => {
      observer.next({ success: true, data: [] });
      observer.complete();
    });
  }

  // BMI Trends (Legacy API)
  getBMITrends(months: number = 6): Observable<any> {
    // For now, return empty trends since we don't have this endpoint in legacy API
    return new Observable(observer => {
      observer.next({ success: true, data: [] });
      observer.complete();
    });
  }

  // Backup Operations
  getBackupHistory(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/backup/history`);
  }

  createBackup(): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/admin/backup/create`, {});
  }

  downloadBackup(filename: string): void {
    window.open(`${environment.apiUrl}/admin/backup/download/${filename}`, '_blank');
  }

  deleteBackup(filename: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/admin/backup/${filename}`);
  }

  restoreBackup(filename: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/admin/backup/restore`, { filename });
  }

  // School Year Management
  getSchoolYears(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/school-years`);
  }

  getCurrentSchoolYear(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/school-years/current`);
  }

  createSchoolYear(schoolYearData: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/admin/school-years`, schoolYearData);
  }

  setCurrentSchoolYear(schoolYearId: number): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/admin/school-years/set-current`, { school_year_id: schoolYearId });
  }

  // Grade Promotion
  getPromotionSummary(currentSchoolYearId: number, targetSchoolYearId?: number): Observable<any> {
    let url = `${environment.apiUrl}/admin/promotion/summary?current_school_year_id=${currentSchoolYearId}`;
    if (targetSchoolYearId) {
      url += `&target_school_year_id=${targetSchoolYearId}`;
    }
    return this.http.get<any>(url);
  }

  bulkPromoteStudents(currentSchoolYearId: number, targetSchoolYearId: number, promotionRules: any, manualCases: any[]): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/admin/promotion/bulk`, {
      current_school_year_id: currentSchoolYearId,
      target_school_year_id: targetSchoolYearId,
      promotion_rules: promotionRules,
      manual_cases: manualCases
    });
  }

  // Admin Profile Management
  updateProfile(profileData: any): Observable<any> {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return this.http.put<any>(`${environment.apiUrl}/admin/users/${currentUser.user_id}`, profileData);
  }

  changePassword(userId: number, currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/admin/users/${userId}/reset-password`, {
      new_password: newPassword
    });
  }
}