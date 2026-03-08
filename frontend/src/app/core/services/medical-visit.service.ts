import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/user.model';

export interface MedicalVisit {
  visit_id: number;
  student_id: number;
  clinic_staff_id: number;
  visit_datetime: string;
  chief_complaint: string;
  notes?: string;
  visit_type: 'Routine' | 'Emergency' | 'Follow-up' | 'Referral';
  status: 'Open' | 'Closed' | 'Referred';
  notify_parent: boolean;
  parent_notified_at?: string;
  notification_method: 'sms' | 'email' | 'call' | 'none';
  created_at?: string;
  updated_at?: string;
  // Relationships
  student?: any;
  clinicStaff?: any;
  vitals?: Vital[];
}

export interface Vital {
  vital_id: number;
  visit_id: number;
  vital_type: 'blood_pressure' | 'heart_rate' | 'temperature' | 'respiratory_rate' | 'oxygen_saturation' | 'height' | 'weight';
  value: string;
  unit?: string;
  notes?: string;
  recorded_at: string;
}

export interface CreateMedicalVisitRequest {
  student_id: number;
  clinic_staff_id: number;
  chief_complaint: string;
  notes?: string;
  notify_parent?: boolean;
  visit_type: 'Routine' | 'Emergency' | 'Follow-up' | 'Referral';
  status?: 'Open' | 'Closed' | 'Referred';
  notification_method?: 'sms' | 'email' | 'call' | 'none';
  vitals?: {
    vital_type: string;
    value: string;
    unit?: string;
    notes?: string;
  }[];
}

export interface VisitStatistics {
  total_visits: number;
  emergency_visits: number;
  pending_visits: number;
  visits_by_type: { [key: string]: number };
  daily_visits: { date: string; count: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class MedicalVisitService {
  constructor(private http: HttpClient) {}

  // Laravel API methods
  getAll(params?: { 
    student_id?: number; 
    date_from?: string; 
    date_to?: string; 
    emergency_only?: boolean;
    visit_type?: string;
    page?: number;
  }): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    
    return this.http.get<any>(`${environment.apiUrl}/medical-visits`, { params: httpParams });
  }

  getById(id: number): Observable<MedicalVisit> {
    return this.http.get<ApiResponse<MedicalVisit>>(`${environment.apiUrl}/medical-visits/${id}`)
      .pipe(map(response => response.data));
  }

  create(visitData: CreateMedicalVisitRequest): Observable<MedicalVisit> {
    return this.http.post<ApiResponse<MedicalVisit>>(`${environment.apiUrl}/medical-visits`, visitData)
      .pipe(map(response => response.data));
  }

  update(id: number, visitData: Partial<MedicalVisit>): Observable<MedicalVisit> {
    return this.http.put<ApiResponse<MedicalVisit>>(`${environment.apiUrl}/medical-visits/${id}`, visitData)
      .pipe(map(response => response.data));
  }

  getStudentVisits(studentId: number, limit?: number): Observable<any> {
    let httpParams = new HttpParams();
    if (limit) {
      httpParams = httpParams.set('limit', limit.toString());
    }
    
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/students/${studentId}/visits`, { params: httpParams })
      .pipe(map(response => response.data));
  }

  getStudentVisitHistory(studentId: number): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/students/${studentId}/visit-history`)
      .pipe(map(response => response.data));
  }

  getEmergencyVisits(days: number = 7): Observable<MedicalVisit[]> {
    const params = new HttpParams().set('days', days.toString());
    
    return this.http.get<ApiResponse<MedicalVisit[]>>(`${environment.apiUrl}/medical-visits/emergency/recent`, { params })
      .pipe(map(response => response.data));
  }

  getStatistics(days: number = 30): Observable<VisitStatistics> {
    const params = new HttpParams().set('days', days.toString());
    
    return this.http.get<ApiResponse<VisitStatistics>>(`${environment.apiUrl}/medical-visits/statistics/summary`, { params })
      .pipe(map(response => response.data));
  }

  // Legacy API methods (keep for backward compatibility during migration)
  saveMedicalVisit(visitData: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/medical-visits`, visitData);
  }

  getMedicalVisits(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(`${environment.apiUrl}/medical-visits`, { params: httpParams });
  }

  updateMedicalVisit(visitId: number, visitData: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/medical-visits/${visitId}`, visitData);
  }
}