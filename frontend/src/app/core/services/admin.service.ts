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

  getActivityLogs(limit: number = 20, offset: number = 0): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/activity-logs?limit=${limit}&offset=${offset}`);
  }

  // Backup & Recovery (Laravel)
  createBackup(): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/admin/backup-database`, {});
  }

  getBackupHistory(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/backup-history`);
  }

  downloadBackup(filename: string): void {
    const url = `${environment.apiUrl}/admin/download-backup?filename=${filename}`;
    this.http.get(url, {
      responseType: 'blob',
      observe: 'response'
    }).subscribe({
      next: (response) => {
        const blob = response.body;
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          window.URL.revokeObjectURL(url);
        }
      },
      error: (error) => {
        console.error('Download failed:', error);
        alert('Failed to download backup file');
      }
    });
  }

  deleteBackup(filename: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/admin/delete-backup?filename=${filename}`);
  }

  restoreBackup(filename: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/admin/restore-backup`, { filename });
  }

  // Grade Promotion
  getSchoolYears(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/school-years`);
  }

  createSchoolYear(yearName: string, startDate: string, endDate: string, isActive: boolean = false): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/admin/school-years`, {
      year_name: yearName,
      start_date: startDate,
      end_date: endDate,
      is_active: isActive
    });
  }

  createSection(sectionName: string, gradeLevelId: number, schoolYearId: number, capacity: number = 50): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/admin/sections`, {
      section_name: sectionName,
      grade_level_id: gradeLevelId,
      school_year_id: schoolYearId,
      capacity
    });
  }

  assignAdviserToSection(sectionId: number, adviserId: number, schoolYearId: number): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/admin/sections/assign-adviser`, {
      section_id: sectionId,
      adviser_id: adviserId,
      school_year_id: schoolYearId
    });
  }

  getPromotionSummary(currentSchoolYearId: number, targetSchoolYearId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/promotions/summary?current_school_year_id=${currentSchoolYearId}&target_school_year_id=${targetSchoolYearId}`);
  }

  bulkPromoteStudents(currentSchoolYearId: number, targetSchoolYearId: number, promotionRules: any, excludeStudentIds: number[] = []): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/admin/students/bulk-promote`, {
      current_school_year_id: currentSchoolYearId,
      target_school_year_id: targetSchoolYearId,
      promotion_rules: promotionRules,
      exclude_student_ids: excludeStudentIds
    });
  }

  manualAdjustPromotion(studentId: number, action: string, newGradeLevelId?: number, newSectionId?: number, notes?: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/admin/students/manual-adjust-promotion`, {
      student_id: studentId,
      action,
      new_grade_level_id: newGradeLevelId,
      new_section_id: newSectionId,
      notes
    });
  }

  // Notifications
  getNotifications(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/notifications`);
  }

  markNotificationAsRead(notificationId: number): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/admin/notifications/read`, {
      notification_id: notificationId
    });
  }

  markAllNotificationsAsRead(): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/admin/notifications/read-all`, {});
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
}
