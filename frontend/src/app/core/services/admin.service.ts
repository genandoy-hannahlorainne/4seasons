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
    return this.http.get<any>(`${environment.apiUrl}/get-admin-dashboard-stats.php`);
  }

  getAllUsers(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/get-all-users.php`);
  }

  getUsersByRole(role: 'student' | 'adviser' | 'faculty' | 'clinic_staff' | 'staff'): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/get-all-users.php?role=${role}`);
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
    return this.http.get<any>(`${environment.apiUrl}/manage-user.php?action=view&user_id=${userId}`);
  }

  updateUser(userId: number, userData: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/manage-user.php?action=update&user_id=${userId}`, userData);
  }

  resetPassword(userId: number, newPassword: string): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/manage-user.php?action=reset-password&user_id=${userId}`, { password: newPassword });
  }

  deactivateUser(userId: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/manage-user.php?action=deactivate&user_id=${userId}`);
  }

  activateUser(userId: number): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/manage-user.php?action=activate&user_id=${userId}`, {});
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/manage-user.php?action=delete&user_id=${userId}`);
  }
}
