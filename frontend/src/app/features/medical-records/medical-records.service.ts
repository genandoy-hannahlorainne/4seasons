import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

export interface PersonalMedicalInfo {
  student_id: number;
  student_number: string;
  full_name: string;
  birth_date: string;
  gender: string;
  blood_type?: string;
  address: string;
  emergency_contact: string;
  grade_level: string;
  section: string;
  adviser_name?: string;
  adviser_contact?: string;
  height_cm?: number;
  weight_kg?: number;
  bmi?: number;
  bmi_category?: string;
}

export interface Allergy {
  allergy_id: number;
  allergy_text: string;
  severity: string;
  recorded_at: string;
}

export interface MedicalRecord {
  personal_info: PersonalMedicalInfo;
  allergies: Allergy[];
  recent_visits_count: number;
  total_visits_count: number;
}

export interface MedicalVisit {
  visit_id: number;
  visit_datetime: string;
  visit_type: string;
  diagnosis: string;
  status: string;
  clinic_staff?: {
    name: string;
    position: string;
    contact?: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any;
}

@Injectable({
  providedIn: 'root'
})
export class MedicalRecordsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getMedicalRecord(): Observable<ApiResponse<MedicalRecord>> {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.student_info?.student_id) {
      throw new Error('Student not authenticated or student info not available');
    }
    return this.http.get<ApiResponse<MedicalRecord>>(`${this.apiUrl}/students/${currentUser.student_info.student_id}/medical-data`);
  }

  getMedicalVisits(): Observable<ApiResponse<MedicalVisit[]>> {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.student_info?.student_id) {
      throw new Error('Student not authenticated or student info not available');
    }
    return this.http.get<ApiResponse<MedicalVisit[]>>(`${this.apiUrl}/students/${currentUser.student_info.student_id}/visits`);
  }

  getVisitDetails(visitId: number): Observable<ApiResponse<MedicalVisit>> {
    return this.http.get<ApiResponse<MedicalVisit>>(`${this.apiUrl}/medical-visits/${visitId}`);
  }

  updateMedicalInfo(data: { emergency_contact?: string; address?: string }): Observable<ApiResponse<any>> {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.student_info?.student_id) {
      throw new Error('Student not authenticated or student info not available');
    }
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/students/${currentUser.student_info.student_id}/physical-info`, data);
  }

  getAdviserByGradeSection(gradeLevel: string, section: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get-adviser-by-grade-section.php?grade_level=${gradeLevel}&section=${section}`);
  }
}