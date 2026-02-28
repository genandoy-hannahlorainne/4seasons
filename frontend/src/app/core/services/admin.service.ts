import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${environment.legacyApiUrl}/get-admin-dashboard-stats.php`);
  }

  getAllUsers(): Observable<any> {
    return this.http.get<any>(`${environment.legacyApiUrl}/get-all-users.php`);
  }

  getUsersByRole(role: 'student' | 'adviser' | 'faculty' | 'clinic_staff' | 'staff'): Observable<any> {
    return this.http.get<any>(`${environment.legacyApiUrl}/get-all-users.php?role=${role}`);
  }

  getStudents(): Observable<any> {
    return this.getUsersByRole('student');
  }

  getAdvisers(): Observable<any> {
    return this.getUsersByRole('adviser');
  }

  getClinicStaff(): Observable<any> {
    return this.getUsersByRole('clinic_staff');
  }

  // User Management
  getUserDetails(userId: number): Observable<any> {
    return this.http.get<any>(`${environment.legacyApiUrl}/manage-user.php?action=view&user_id=${userId}`);
  }

  updateUser(userId: number, userData: any): Observable<any> {
    return this.http.put<any>(`${environment.legacyApiUrl}/manage-user.php?action=update&user_id=${userId}`, userData);
  }

  resetPassword(userId: number, newPassword: string): Observable<any> {
    return this.http.put<any>(`${environment.legacyApiUrl}/manage-user.php?action=reset-password&user_id=${userId}`, { password: newPassword });
  }

  deactivateUser(userId: number): Observable<any> {
    return this.http.delete<any>(`${environment.legacyApiUrl}/manage-user.php?action=deactivate&user_id=${userId}`);
  }

  activateUser(userId: number): Observable<any> {
    return this.http.put<any>(`${environment.legacyApiUrl}/manage-user.php?action=activate&user_id=${userId}`, {});
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete<any>(`${environment.legacyApiUrl}/manage-user.php?action=delete&user_id=${userId}`);
  }

  // Create User - Laravel API
  createUser(userData: any): Observable<any> {
    // Map frontend data to Laravel API format
    const laravelData = {
      student_number: userData.student_number,
      first_name: userData.first_name,
      middle_name: userData.middle_name,
      last_name: userData.last_name,
      birth_date: userData.birth_date,
      gender: userData.gender,
      grade_level: userData.grade_level, // Admin grade level (1-6)
      section_id: userData.section_id, // Will be set by getSectionsForGrade
      email: userData.email,
      phone: userData.phone,
      emergency_contact_name: userData.emergency_contact_name,
      emergency_contact_phone: userData.emergency_contact_phone
    };
    
    return this.http.post<any>(`${environment.apiUrl}/admin/students`, laravelData);
  }

  // Create User - Legacy API (for non-students)
  createUserLegacy(userData: any): Observable<any> {
    return this.http.post<any>(`${environment.legacyApiUrl}/admin/create-user.php`, userData);
  }

  // Get sections for a specific grade level (Laravel API)
  getSectionsForGrade(gradeLevel: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/sections/grade/${gradeLevel}`);
  }

  // Get all grade levels with sections (Laravel API)
  getGradeLevelsWithSections(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/grade-levels/sections`);
  }

  // Bulk Import Students
  bulkImportStudents(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('csv_file', file);
    return this.http.post<any>(`${environment.legacyApiUrl}/admin/students/bulk-import.php`, formData);
  }

  // System Settings
  getSystemSettings(): Observable<any> {
    return this.http.get<any>(`${environment.legacyApiUrl}/system-settings.php?action=get-all`);
  }

  updateSystemSettings(section: string, settings: any): Observable<any> {
    return this.http.put<any>(`${environment.legacyApiUrl}/system-settings.php?action=update`, {
      section,
      settings
    });
  }

  // Reports
  getReport(reportType: string, startDate?: string, endDate?: string): Observable<any> {
    let url = `${environment.legacyApiUrl}/admin-reports.php?type=${reportType}`;
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

  getActivityLogs(limit: number = 20, offset: number = 0): Observable<any> {
    return this.http.get<any>(`${environment.legacyApiUrl}/get-activity-logs.php?limit=${limit}&offset=${offset}`);
  }

  // Backup & Recovery
  createBackup(): Observable<any> {
    return this.http.post<any>(`${environment.legacyApiUrl}/backup-database.php`, {});
  }

  getBackupHistory(): Observable<any> {
    return this.http.get<any>(`${environment.legacyApiUrl}/get-backup-history.php`);
  }

  downloadBackup(filename: string): void {
    const url = `${environment.legacyApiUrl}/download-backup.php?filename=${filename}`;
    
    // Use HttpClient to download with authentication headers
    this.http.get(url, {
      responseType: 'blob',
      observe: 'response'
    }).subscribe({
      next: (response) => {
        // Create a blob URL and trigger download
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
    return this.http.delete<any>(`${environment.legacyApiUrl}/delete-backup.php?filename=${filename}`);
  }

  restoreBackup(filename: string): Observable<any> {
    return this.http.post<any>(`${environment.legacyApiUrl}/restore-backup.php`, { filename });
  }

  // Grade Promotion
  getSchoolYears(): Observable<any> {
    return this.http.get<any>(`${environment.legacyApiUrl}/admin/school-years/list.php`);
  }

  createSchoolYear(yearName: string, startDate: string, endDate: string, isActive: boolean = false): Observable<any> {
    return this.http.post<any>(`${environment.legacyApiUrl}/admin/school-years/create.php`, {
      year_name: yearName,
      start_date: startDate,
      end_date: endDate,
      is_active: isActive
    });
  }

  createSection(sectionName: string, gradeLevelId: number, schoolYearId: number, capacity: number = 50): Observable<any> {
    return this.http.post<any>(`${environment.legacyApiUrl}/admin/sections/create.php`, {
      section_name: sectionName,
      grade_level_id: gradeLevelId,
      school_year_id: schoolYearId,
      capacity
    });
  }

  assignAdviserToSection(sectionId: number, adviserId: number, schoolYearId: number): Observable<any> {
    return this.http.post<any>(`${environment.legacyApiUrl}/admin/sections/assign-adviser.php`, {
      section_id: sectionId,
      adviser_id: adviserId,
      school_year_id: schoolYearId
    });
  }

  getPromotionSummary(currentSchoolYearId: number, targetSchoolYearId: number): Observable<any> {
    return this.http.get<any>(`${environment.legacyApiUrl}/admin/promotions/get-summary.php?current_school_year_id=${currentSchoolYearId}&target_school_year_id=${targetSchoolYearId}`);
  }

  bulkPromoteStudents(currentSchoolYearId: number, targetSchoolYearId: number, promotionRules: any, excludeStudentIds: number[] = []): Observable<any> {
    return this.http.post<any>(`${environment.legacyApiUrl}/admin/students/bulk-promote.php`, {
      current_school_year_id: currentSchoolYearId,
      target_school_year_id: targetSchoolYearId,
      promotion_rules: promotionRules,
      exclude_student_ids: excludeStudentIds
    });
  }

  manualAdjustPromotion(studentId: number, action: string, newGradeLevelId?: number, newSectionId?: number, notes?: string): Observable<any> {
    return this.http.post<any>(`${environment.legacyApiUrl}/admin/students/manual-adjust-promotion.php`, {
      student_id: studentId,
      action,
      new_grade_level_id: newGradeLevelId,
      new_section_id: newSectionId,
      notes
    });
  }

  // Notifications
  getNotifications(): Observable<any> {
    return this.http.get<any>(`${environment.legacyApiUrl}/get-admin-notifications.php`);
  }

  markNotificationAsRead(notificationId: number): Observable<any> {
    return this.http.put<any>(`${environment.legacyApiUrl}/manage-notifications.php`, {
      notification_id: notificationId
    });
  }

  markAllNotificationsAsRead(): Observable<any> {
    return this.http.post<any>(`${environment.legacyApiUrl}/manage-notifications.php`, {});
  }

  deleteNotification(notificationId: number): Observable<any> {
    return this.http.request<any>('DELETE', `${environment.legacyApiUrl}/manage-notifications.php`, {
      body: { notification_id: notificationId }
    });
  }

  // Send SMS to parent
  sendParentSMS(visitId: number): Observable<any> {
    return this.http.post<any>(`${environment.legacyApiUrl}/admin/send-parent-sms.php`, {
      visit_id: visitId
    });
  }
}
