import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface StudentVisitSummary {
  student_id: number;
  studentName: string;
  studentNumber: string;
  gradeSection: string;
  avatar: string;
  totalVisits: number;
  lastVisit: string;
  lastVisitDate: string;
  diagnosis: string;
  status: string;
  visits: any[];
}

@Component({
  selector: 'app-visits-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="visits-page">
      <div class="page-header">
        <div class="header-content">
          <h1>Medical Visits</h1>
          <p>Student visit summary and records</p>
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

      <!-- Student Summary List -->
      <div class="card" *ngIf="!loading">
        <!-- No Visits Indicator -->
        <div class="no-visits-alert" *ngIf="filteredStudents.length === 0">
          <div class="alert-icon">📋</div>
          <div class="alert-content">
            <h3>No Medical Visits Yet</h3>
            <p>There are no medical visits recorded in the system.</p>
            <p class="alert-hint">Create a new clinic visit to get started.</p>
          </div>
          <button class="btn btn-primary" routerLink="/dashboard/staff/visits/new">
            + Create First Visit
          </button>
        </div>

        <div class="student-summary-list" *ngIf="filteredStudents.length > 0">
          <div *ngFor="let student of filteredStudents" class="student-summary-card">
            <div class="student-header">
              <div class="student-info">
                <img [src]="student.avatar" [alt]="student.studentName" class="student-avatar">
                <div class="student-details">
                  <span class="student-name">{{ student.studentName }}</span>
                  <span class="student-number">{{ student.studentNumber }}</span>
                  <span class="student-grade">{{ student.gradeSection }}</span>
                </div>
              </div>
              <div class="visit-stats">
                <div class="stat">
                  <span class="stat-label">Total Visits</span>
                  <span class="stat-value">{{ student.totalVisits }}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Last Visit</span>
                  <span class="stat-value">{{ student.lastVisitDate }}</span>
                </div>
              </div>
            </div>

            <div class="student-body">
              <div class="visit-info">
                <span class="info-label">Latest Diagnosis:</span>
                <span class="info-value">{{ student.diagnosis || 'N/A' }}</span>
              </div>
              <div class="visit-info">
                <span class="info-label">Status:</span>
                <span class="status-badge" [class]="student.status">{{ student.status }}</span>
              </div>
            </div>

            <div class="student-actions">
              <button class="btn btn-outline btn-sm" [routerLink]="['/dashboard/staff/students', student.student_id]">
                View Profile
              </button>
              <button class="btn btn-outline btn-sm" routerLink="/dashboard/staff/visits/new" [queryParams]="{studentId: student.student_id}">
                + New Visit
              </button>
            </div>

            <!-- Recent Visits Expandable -->
            <div class="recent-visits" *ngIf="student.visits.length > 0">
              <div class="visits-header" (click)="toggleVisitsExpanded(student.student_id)">
                <span class="toggle-icon">{{ expandedStudents[student.student_id] ? '▼' : '▶' }}</span>
                <span>Recent Visits ({{ student.visits.length }})</span>
              </div>
              <div class="visits-list" *ngIf="expandedStudents[student.student_id]">
                <div *ngFor="let visit of student.visits.slice(0, 3)" class="visit-item">
                  <span class="visit-date">{{ visit.dateTime }}</span>
                  <span class="visit-type">{{ visit.visitType }}</span>
                  <span class="visit-diagnosis">{{ visit.diagnosis || 'N/A' }}</span>
                </div>
              </div>
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

    .no-visits-alert {
      background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
      border: 2px dashed #4caf50;
      border-radius: 12px;
      padding: 2rem;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      text-align: left;

      .alert-icon {
        font-size: 3rem;
        flex-shrink: 0;
      }

      .alert-content {
        flex: 1;

        h3 {
          color: #2e7d32;
          margin: 0 0 0.5rem;
          font-size: 1.2rem;
        }

        p {
          color: #558b2f;
          margin: 0.25rem 0;
          font-size: 0.95rem;

          &.alert-hint {
            color: #689f38;
            font-style: italic;
            margin-top: 0.5rem;
          }
        }
      }

      .btn {
        flex-shrink: 0;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;

        &.btn-primary {
          background: #4caf50;
          color: white;

          &:hover {
            background: #388e3c;
          }
        }
      }
    }

    .student-summary-list { display: grid; gap: 1rem; }

    .student-summary-card {
      border: 1px solid #e9ecef;
      border-radius: 10px;
      padding: 1rem;
      transition: all 0.2s ease;
      &:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    }

    .student-header {
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

      .student-avatar { width: 50px; height: 50px; border-radius: 50%; }
      .student-details { display: flex; flex-direction: column; }
      .student-name { font-weight: 600; color: #2c3e50; }
      .student-number { font-size: 0.85rem; color: #7f8c8d; }
      .student-grade { font-size: 0.8rem; color: #95a5a6; }
    }

    .visit-stats {
      display: flex;
      gap: 2rem;

      .stat {
        display: flex;
        flex-direction: column;
        align-items: center;

        .stat-label { font-size: 0.8rem; color: #7f8c8d; }
        .stat-value { font-size: 1.2rem; font-weight: 600; color: #2c3e50; }
      }
    }

    .student-body { margin-bottom: 1rem; }

    .visit-info {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;

      .info-label { color: #7f8c8d; font-size: 0.9rem; }
      .info-value { color: #2c3e50; font-size: 0.9rem; }
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;

      &.pending { background: #fff3cd; color: #856404; }
      &.completed { background: #d4edda; color: #155724; }
      &.referred { background: #cce5ff; color: #004085; }
    }

    .student-actions { 
      display: flex; 
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .recent-visits {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e9ecef;

      .visits-header {
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #007bff;
        font-weight: 500;
        font-size: 0.9rem;

        .toggle-icon {
          display: inline-block;
          transition: transform 0.2s ease;
        }

        &:hover { text-decoration: underline; }
      }

      .visits-list {
        margin-top: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .visit-item {
        display: flex;
        gap: 1rem;
        padding: 0.5rem;
        background: #f8f9fa;
        border-radius: 6px;
        font-size: 0.85rem;

        .visit-date { color: #7f8c8d; min-width: 120px; }
        .visit-type { color: #2c3e50; font-weight: 500; }
        .visit-diagnosis { color: #495057; }
      }
    }

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
  studentSummaries: StudentVisitSummary[] = [];
  filteredStudents: StudentVisitSummary[] = [];
  expandedStudents: { [key: number]: boolean } = {};

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadVisits();
  }

  loadVisits(): void {
    this.loading = true;
    let url = `${environment.apiUrl}/get-medical-visits.php`;
    
    const params = [];
    if (this.dateFilter) {
      params.push(`date=${this.dateFilter}`);
    }
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    this.http.get<any>(url).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        this.loading = false;
        if (response.success) {
          this.visits = response.data || response.visits || [];
          console.log('Visits loaded:', this.visits.length, this.visits);
          this.groupVisitsByStudent();
          console.log('Student summaries:', this.studentSummaries.length, this.studentSummaries);
          this.filterVisits();
          console.log('Filtered students:', this.filteredStudents.length, this.filteredStudents);
        } else {
          console.warn('API returned success: false', response);
        }
      },
      error: (err) => {
        console.error('Error loading visits:', err);
        this.loading = false;
      }
    });
  }

  groupVisitsByStudent(): void {
    const studentMap = new Map<number, StudentVisitSummary>();

    this.visits.forEach((visit, index) => {
      const studentId = visit.student_id;
      
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          student_id: studentId,
          studentName: visit.studentName,
          studentNumber: visit.studentNumber,
          gradeSection: visit.gradeSection,
          avatar: visit.avatar,
          totalVisits: 0,
          lastVisit: '',
          lastVisitDate: '',
          diagnosis: '',
          status: '',
          visits: []
        });
      }

      const summary = studentMap.get(studentId)!;
      summary.totalVisits++;
      summary.visits.push(visit);

      // Set latest visit info on FIRST visit (since visits are sorted DESC by date)
      if (summary.totalVisits === 1) {
        summary.lastVisit = visit.dateTime || '';
        summary.lastVisitDate = visit.dateTime ? visit.dateTime.split(' ')[0] : '';
        summary.diagnosis = visit.diagnosis || 'N/A';
        summary.status = visit.status || 'pending';
      }
    });

    this.studentSummaries = Array.from(studentMap.values());
    console.log('Grouped into', this.studentSummaries.length, 'students');
  }

  filterVisits(): void {
    this.filteredStudents = this.studentSummaries.filter(student => {
      const matchesSearch = !this.searchTerm || 
        student.studentName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        student.studentNumber.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = !this.statusFilter || student.status === this.statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }

  toggleVisitsExpanded(studentId: number): void {
    this.expandedStudents[studentId] = !this.expandedStudents[studentId];
  }
}
