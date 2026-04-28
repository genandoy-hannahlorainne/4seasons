import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  EmergencyDrill,
  DrillDashboard,
  CreateDrillRequest,
  AddParticipantsRequest,
  ScanParticipantRequest
} from '../models/emergency-drill.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmergencyDrillService {
  private apiUrl = `${environment.apiUrl}/emergency-drills`;

  constructor(private http: HttpClient) {}

  // Get all drills with optional filters
  getDrills(params?: { status?: string; drill_type?: string; page?: number }): Observable<any> {
    return this.http.get<any>(this.apiUrl, { params });
  }

  // Get drill details
  getDrill(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Create new drill
  createDrill(drill: CreateDrillRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, drill);
  }

  // Update drill
  updateDrill(id: number, drill: Partial<EmergencyDrill>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, drill);
  }

  // Delete drill
  deleteDrill(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // Start drill
  startDrill(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/start`, {});
  }

  // End drill
  endDrill(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/end`, {});
  }

  // Add participants to drill
  addParticipants(id: number, participants: AddParticipantsRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/participants`, participants);
  }

  // Scan participant
  scanParticipant(id: number, scanData: ScanParticipantRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/scan`, scanData);
  }

  // Get drill dashboard data
  getDrillDashboard(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/dashboard`);
  }

  // Search users for scanning
  searchUsers(id: number, query: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/search-users`, {
      params: { q: query }
    });
  }
}
