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
  blood_type: string;
  address: string;
  emergency_contact: string;
  grade_level: string;
  section: string;
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
  chief_complaint: string;
  notes: string;
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
    if (!currentUser || !currentUser.user_id) {
      throw new Error('User not authenticated');
    }
    return this.http.get<ApiResponse<MedicalRecord>>(`${this.apiUrl}/get-student-medical-data.php?user_id=${currentUser.user_id}`);
  }

  getMedicalVisits(): Observable<ApiResponse<MedicalVisit[]>> {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.user_id) {
      throw new Error('User not authenticated');
    }
    // Get student_id from the profile first, then fetch visits
    return this.http.get<ApiResponse<MedicalVisit[]>>(`${this.apiUrl}/get-medical-visits.php?user_id=${currentUser.user_id}`);
  }

  getVisitDetails(visitId: number): Observable<ApiResponse<MedicalVisit>> {
    return this.http.get<ApiResponse<MedicalVisit>>(`${this.apiUrl}/medical-visits/${visitId}`);
  }

  updateMedicalInfo(data: { emergency_contact?: string; address?: string }): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/update-medical-info.php`, data);
  }

  getAdviserByGradeSection(gradeLevel: string, section: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get-adviser-by-grade-section.php?grade_level=${gradeLevel}&section=${section}`);
  }
}