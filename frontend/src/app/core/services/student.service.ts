import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/user.model';

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
  height_cm?: number;
  weight_kg?: number;
  bmi?: number;
  bmi_category?: string;
}

export interface Student {
  student_id: number;
  student_number: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  birth_date?: string;
  gender?: 'M' | 'F' | 'Other';
  grade_level?: string;
  section?: string;
  address?: string;
  blood_type?: string;
  emergency_contact?: string;
  emergency_contact_relation?: string;
  emergency_contact_phone?: string;
  height_cm?: number;
  weight_kg?: number;
  bmi?: number;
  bmi_category?: string;
  is_active: boolean;
  user_id?: number;
  created_at?: string;
  last_physical_update?: string;
  user?: any;
  medical_history?: any;
  allergies?: any[];
  medical_visits?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  constructor(private http: HttpClient) {}

  // Laravel API methods
  getAll(params?: { search?: string; grade_level?: string; section?: string; page?: number }): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key as keyof typeof params]) {
          httpParams = httpParams.set(key, params[key as keyof typeof params]!.toString());
        }
      });
    }
    
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/students`, { params: httpParams })
      .pipe(map(response => response.data));
  }

  getById(id: number): Observable<Student> {
    return this.http.get<ApiResponse<Student>>(`${environment.apiUrl}/students/${id}`)
      .pipe(map(response => response.data));
  }

  update(id: number, studentData: Partial<Student>): Observable<Student> {
    return this.http.put<ApiResponse<Student>>(`${environment.apiUrl}/students/${id}`, studentData)
      .pipe(map(response => response.data));
  }

  getMedicalData(id: number): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/students/${id}/medical-data`)
      .pipe(map(response => response.data));
  }

  updateMedicalData(id: number, payload: {
    personal_info?: any;
    physical_info?: any;
    medical_history?: any;
    allergies?: any[];
  }): Observable<any> {
    return this.http.put<ApiResponse<any>>(`${environment.apiUrl}/students/${id}/medical-data`, payload);
  }

  updatePhysicalInfo(id: number, physicalData: { height_cm: number; weight_kg: number; blood_type?: string }): Observable<any> {
    return this.http.put<ApiResponse<any>>(`${environment.apiUrl}/students/${id}/physical-info`, physicalData)
      .pipe(map(response => response.data));
  }

  getStreakBadgeMetadata(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/student/streak-badges/metadata`)
      .pipe(map(response => response.data));
  }

  generateBadgeNarrative(payload: {
    student_name: string;
    badge_name: string;
    streak_days: number;
    badge_key?: string;
  }): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/student/badges/generate-text`, payload)
      .pipe(map(response => response.data));
  }

  // Legacy API methods (keep for backward compatibility during migration)
  getStudentProfile(userId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/students/${userId}`);
  }

  updateStudentProfile(userId: number, profileData: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/students/${userId}`, profileData);
  }

  getStudentMedicalData(userId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/students/medical-data?user_id=${userId}`);
  }

  getStudentQRCode(studentId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/students/qr?student_id=${studentId}`);
  }

  addAllergy(allergyData: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/students/allergies`, allergyData);
  }

  updateAllergy(allergyData: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/students/allergies`, allergyData);
  }

  removeAllergy(allergyId: number): Observable<any> {
    return this.http.request<any>('DELETE', `${environment.apiUrl}/students/allergies`, {
      body: { allergy_id: allergyId }
    });
  }

  updateStudentPhysicalInfo(userId: number, physicalData: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/students/physical-info`, {
      user_id: userId,
      ...physicalData
    });
  }

  updateStudentAllergies(userId: number, allergies: any[]): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/students/allergies/bulk-update`, {
      action: 'bulk_update',
      user_id: userId,
      allergies: allergies
    });
  }

  updateMedicalHistory(userId: number, medicalHistory: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/students/medical-history`, {
      user_id: userId,
      medical_history: medicalHistory
    });
  }
}
