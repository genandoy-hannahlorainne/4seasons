import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MedicalVisit, Vitals, Diagnosis } from '../models/medical-visit.model';

@Injectable({
  providedIn: 'root'
})
export class MedicalVisitService {
  private apiUrl = `${environment.apiUrl}/medical-visits`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<MedicalVisit[]> {
    return this.http.get<MedicalVisit[]>(this.apiUrl);
  }

  getById(id: number): Observable<MedicalVisit> {
    return this.http.get<MedicalVisit>(`${this.apiUrl}/${id}`);
  }

  getByStudentId(studentId: number): Observable<MedicalVisit[]> {
    return this.http.get<MedicalVisit[]>(`${this.apiUrl}/student/${studentId}`);
  }

  create(visit: Partial<MedicalVisit>): Observable<MedicalVisit> {
    return this.http.post<MedicalVisit>(this.apiUrl, visit);
  }

  update(id: number, visit: Partial<MedicalVisit>): Observable<MedicalVisit> {
    return this.http.put<MedicalVisit>(`${this.apiUrl}/${id}`, visit);
  }

  addVitals(visitId: number, vitals: Partial<Vitals>): Observable<Vitals> {
    return this.http.post<Vitals>(`${this.apiUrl}/${visitId}/vitals`, vitals);
  }

  addDiagnosis(visitId: number, diagnosis: Partial<Diagnosis>): Observable<Diagnosis> {
    return this.http.post<Diagnosis>(`${this.apiUrl}/${visitId}/diagnoses`, diagnosis);
  }
}
