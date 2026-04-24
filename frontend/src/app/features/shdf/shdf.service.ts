import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SHDFRecord {
  student: any;
  philhealth: any;
  immunization: any;
  medical_history: any;
  family_history: any;
  parental_consent: any;
  status?: SHDFStatus;
  can_generate_qr?: boolean;
  is_fully_compliant?: boolean;
}

export interface SHDFStatus {
  basic_completed: boolean;
  comprehensive_completed: boolean;
  can_generate_qr: boolean;
  is_fully_compliant: boolean;
  comprehensive_deadline?: string;
  is_overdue?: boolean;
  is_deadline_approaching?: boolean;
}

export interface SHDFBasicData {
  student_id: number;
  parent_guardian_name: string;
  emergency_contact: string;
  emergency_contact_relation: string;
  emergency_contact_phone: string;
  address?: string;
  height_cm?: number;
  weight_kg?: number;
  blood_type?: string;
}

export interface SHDFBasicResponse {
  success: boolean;
  message: string;
  can_generate_qr: boolean;
  comprehensive_deadline?: string;
}

@Injectable({ providedIn: 'root' })
export class SHDFService {
  private apiUrl = `${environment.apiUrl}/shdf`;

  constructor(private http: HttpClient) {}

  getShdf(studentId: number): Observable<SHDFRecord> {
    return this.http.get<SHDFRecord>(`${this.apiUrl}/${studentId}`);
  }

  getShdfByYear(studentId: number, schoolYearId: number): Observable<SHDFRecord> {
    return this.http.get<SHDFRecord>(`${this.apiUrl}/${studentId}/${schoolYearId}`);
  }

  getStatus(studentId: number): Observable<SHDFStatus> {
    return this.http.get<SHDFStatus>(`${this.apiUrl}/${studentId}/status`);
  }

  submitBasic(data: SHDFBasicData): Observable<SHDFBasicResponse> {
    return this.http.post<SHDFBasicResponse>(`${this.apiUrl}/basic`, data);
  }

  submitComprehensive(payload: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/comprehensive`, payload);
  }

  submitShdf(payload: FormData): Observable<SHDFRecord> {
    return this.http.post<SHDFRecord>(this.apiUrl, payload);
  }
}
