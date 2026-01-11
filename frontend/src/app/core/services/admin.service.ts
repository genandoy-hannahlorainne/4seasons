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
}
