import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-visits-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="visits-page">
      <div class="page-header">
        <div class="header-content">
          <h1>Medical Visits</h1>
          <p>Manage student clinic visits</p>
        </div>
        <button class="btn btn-primary" routerLink="/dashboard/staff/visits/new">+ New Visit</button>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading">
        <p>Loading visits...</p>
      </div>

      <!-- Filters -->
      <div class="filters-section" *ngIf="!loading">
        <div class="search-box">
          <input 
            type="text" 
            [(ngModel)]="searchTerm" 
            (ngModelChange)="filterVisits()"
            placeholder="Search by student name..."
            class="search-input">
        </div>
        <div class="filter-group">
          <input type="date" [(ngModel)]="dateFilter" (ngModelChange)="loadVisits()" class="filter-input">
          <select [(ngModel)]="statusFilter" (ngModelChange)="filterVisits()" class="filter-select">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="referred">Referred</option>
          </select>
        </div>
      </div>

      <!-- Visits List -->
      <div class="card" *ngIf="!loading">
        <div class="empty-state" *ngIf="filteredVisits.length === 0">
          <div class="empty-title">No Visits Found</div>
          <div class="empty-text">No medical visits recorded yet. Click "New Visit" to add one.</div>
        </div>

        <div class="visits-list" *ngIf="filteredVisits.length > 0">
          <div *ngFor="let visit of filteredVisits" class="visit-card">
            <div class="visit-header">
              <div class="student-info">
                <img [src]="visit.avatar" [alt]="visit.studentName" class="student-avatar">
                <div class="student-details">
                  <span class="student-name">{{ visit.studentName }}</span>
                  <span class="student-number">{{ visit.studentNumber }}</span>
                </div>
              </div>
              <span class="visit-status" [class]="visit.status">{{ visit.status }}</span>
            </div>
            <div class="visit-body">
              <div class="visit-info">
                <span class="info-label">Chief Complaint:</span>
                <span class="info-value">{{ visit.chiefComplaint }}</span>
              </div>
              <div class="visit-info">
                <span class="info-label">Date & Time:</span>
                <span class="info-value">{{ visit.dateTime }}</span>
              </div>
              <div class="visit-info" *ngIf="visit.diagnosis">
                <span class="info-label">Diagnosis:</span>
                <span class="info-value">{{ visit.diagnosis }}</span>
              </div>
            </div>
            <div class="visit-actions">
              <button class="btn btn-outline btn-sm" (click)="viewVisit(visit)">View</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .visits-page {
      padding: 2rem;
      background: #f5f7fa;
      min-height: 100vh;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;

      .header-content {
        h1 { font-size: 1.8rem; color: #2c3e50; margin-bottom: 0.5rem; font-weight: 600; }
        p { color: #7f8c8d; font-size: 1rem; margin: 0; }
      }
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;

      &.btn-primary { background: #007bff; color: white; &:hover { background: #0056b3; } }
      &.btn-outline { background: white; color: #007bff; border: 1px solid #007bff; &:hover { background: #e3f2fd; } }
      &.btn-sm { padding: 0.4rem 0.75rem; font-size: 0.85rem; }
    }

    .filters-section {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 300px;

      .search-input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        font-size: 1rem;
        background: white;
        &:focus { outline: none; border-color: #007bff; }
      }
    }

    .filter-group { display: flex; gap: 0.5rem; }

    .filter-input, .filter-select {
      padding: 0.75rem 1rem;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      font-size: 0.9rem;
      background: white;
      &:focus { outline: none; border-color: #007bff; }
    }

    .card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;

      .empty-title { font-size: 1.3rem; font-weight: 600; color: #2c3e50; margin-bottom: 0.5rem; }
      .empty-text { color: #7f8c8d; }
    }

    .visits-list { display: grid; gap: 1rem; }

    .visit-card {
      border: 1px solid #e9ecef;
      border-radius: 10px;
      padding: 1rem;
      transition: all 0.2s ease;
      &:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    }

    .visit-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e9ecef;
    }

    .student-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .student-avatar { width: 40px; height: 40px; border-radius: 50%; }
      .student-details { display: flex; flex-direction: column; }
      .student-name { font-weight: 600; color: #2c3e50; }
      .student-number { font-size: 0.85rem; color: #7f8c8d; }
    }

    .visit-status {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;

      &.pending { background: #fff3cd; color: #856404; }
      &.completed { background: #d4edda; color: #155724; }
      &.referred { background: #cce5ff; color: #004085; }
    }

    .visit-body { margin-bottom: 1rem; }

    .visit-info {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;

      .info-label { color: #7f8c8d; font-size: 0.9rem; }
      .info-value { color: #2c3e50; font-size: 0.9rem; }
    }

    .visit-actions { display: flex; gap: 0.5rem; }

    .loading-state {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 12px;
      color: #7f8c8d;
    }
  `]
})
export class VisitsListComponent implements OnInit {
  searchTerm = '';
  dateFilter = '';
  statusFilter = '';
  loading = true;
  
  visits: any[] = [];
  filteredVisits: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadVisits();
  }

  loadVisits(): void {
    this.loading = true;
    let url = `${environment.apiUrl}/get-medical-visits.php`;
    
    if (this.dateFilter) {
      url += `?date=${this.dateFilter}`;
    }

    this.http.get<any>(url).subscribe({
      next: (response) => {
        if (response.success) {
          this.visits = response.visits;
          this.filterVisits();
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading visits:', err);
        this.loading = false;
      }
    });
  }

  filterVisits(): void {
    this.filteredVisits = this.visits.filter(visit => {
      const matchesSearch = !this.searchTerm || 
        visit.studentName.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = !this.statusFilter || visit.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  viewVisit(visit: any): void {
    console.log('View visit:', visit);
    // Could open a modal with full details
    alert(`Visit Details:\n\nStudent: ${visit.studentName}\nDate: ${visit.dateTime}\nComplaint: ${visit.chiefComplaint}\nDiagnosis: ${visit.diagnosis || 'N/A'}\nTreatment: ${visit.treatment || 'N/A'}\nStatus: ${visit.status}`);
  }
}
