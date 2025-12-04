import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StudentProfile {
  student_id: number;
  student_number: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  birth_date: string;
  gender: string;
  grade_level?: string;
  section?: string;
  address?: string;
  blood_type?: string;
  emergency_contact?: string;
  email: string;
  contact_number: string;
}

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  constructor(private http: HttpClient) {}

  getStudentProfile(userId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/get-student-profile.php?user_id=${userId}`);
  }

  updateStudentProfile(userId: number, profileData: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/update-student-profile.php`, {
      user_id: userId,
      ...profileData
    });
  }

  getStudentMedicalData(studentId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/get-student-medical-data.php?student_id=${studentId}`);
  }

  // TODO: Implement these methods when backend APIs are ready
  getAll(): Observable<any> {
    // Placeholder - return empty array for now
    return this.http.get<any>(`${environment.apiUrl}/get-all-students.php`);
  }

  getById(id: number): Observable<any> {
    // Placeholder - return student by ID
    return this.http.get<any>(`${environment.apiUrl}/get-student.php?id=${id}`);
  }
}
