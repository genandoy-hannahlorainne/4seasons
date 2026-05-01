import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MedicalVisitService } from '../../../../core/services/medical-visit.service';

interface StudentVisitSummary {
  student_id: number;
  student_name: string;
  student_number: string;
  grade_section: string;
  total_visits: number;
  last_visit: {
    visit_id: number;
    visit_datetime: string;
    visit_type: string;
    chief_complaint: string;
    diagnosis?: string;
    status: string;
    is_emergency: boolean;
  } | null;
  recent_visits: any[];
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
        <div class="loading-spinner"></div>
        <p>Loading visits...</p>
      </div>

      <!-- Error State -->
      <div class="error-state" *ngIf="error && !loading">
        <div class="error-icon">⚠️</div>
        <div class="error-content">
          <h3>Error Loading Visits</h3>
          <p>{{ error }}</p>
          <button class="btn btn-primary" (click)="loadVisits()">Try Again</button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section" *ngIf="!loading && !error">
        <div class="search-box">
          <input
            type="text"
            [(ngModel)]="searchTerm"
            (ngModelChange)="filterVisits()"
            placeholder="Search by student name or number..."
            class="search-input">
        </div>
        <div class="filter-group">
          <input type="date" [(ngModel)]="dateFilter" (ngModelChange)="loadVisits()" class="filter-input">
          <select [(ngModel)]="statusFilter" (ngModelChange)="filterVisits()" class="filter-select">
            <option value="">All Status</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
            <option value="Referred">Referred</option>
          </select>
          <select [(ngModel)]="typeFilter" (ngModelChange)="filterVisits()" class="filter-select">
            <option value="">All Types</option>
            <option value="Routine">Routine</option>
            <option value="Emergency">Emergency</option>
          </select>
        </div>
      </div>

      <!-- Student Summary List -->
      <div class="card" *ngIf="!loading && !error">
        <!-- No Visits Indicator -->
        <div class="no-visits-alert" *ngIf="filteredStudents.length === 0 && allVisits.length === 0">
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

        <!-- No Results from Filter -->
        <div class="no-results-alert" *ngIf="filteredStudents.length === 0 && allVisits.length > 0">
          <div class="alert-icon">🔍</div>
          <div class="alert-content">
            <h3>No Results Found</h3>
            <p>No visits match your current search criteria.</p>
            <button class="btn btn-outline" (click)="clearFilters()">Clear Filters</button>
          </div>
        </div>

        <div class="student-summary-list" *ngIf="filteredStudents.length > 0">
          <div *ngFor="let student of filteredStudents" class="student-summary-card">
            <div class="student-header">
              <div class="student-info">
                <div class="student-avatar">
                  <span class="avatar-text">{{ getStudentInitials(student.student_name) }}</span>
                </div>
                <div class="student-details">
                  <span class="student-name">{{ student.student_name }}</span>
                  <span class="student-number">{{ student.student_number }}</span>
                  <span class="student-grade">{{ student.grade_section }}</span>
                </div>
              </div>
              <div class="visit-stats">
                <div class="stat">
                  <span class="stat-label">Total Visits</span>
                  <span class="stat-value">{{ student.total_visits }}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Last Visit</span>
                  <span class="stat-value">{{ getLastVisitDate(student.last_visit?.visit_datetime) }}</span>
                </div>
              </div>
            </div>

            <div class="student-body" *ngIf="student.last_visit">
              <div class="visit-info">
                <span class="info-label">Latest Visit Type:</span>
                <span class="visit-type-badge" [class]="'type-' + student.last_visit.visit_type">
                  {{ student.last_visit.visit_type }}
                </span>
                <span *ngIf="student.last_visit.is_emergency" class="emergency-badge">🚨 Emergency</span>
              </div>
              <div class="visit-info">
                <span class="info-label">Chief Complaint:</span>
                <span class="info-value">{{ student.last_visit.chief_complaint }}</span>
              </div>
              <div class="visit-info" *ngIf="student.last_visit.diagnosis">
                <span class="info-label">Diagnosis:</span>
                <span class="info-value">{{ student.last_visit.diagnosis }}</span>
              </div>
              <div class="visit-info">
                <span class="info-label">Status:</span>
                <span class="status-badge" [class]="'status-' + student.last_visit.status">{{ student.last_visit.status }}</span>
              </div>
            </div>

            <div class="student-actions">
              <button class="btn btn-outline btn-sm" [routerLink]="['/dashboard/staff/students', student.student_id]">
                View Profile
              </button>
              <button class="btn btn-outline btn-sm" routerLink="/dashboard/staff/visits/new" [queryParams]="{studentId: student.student_id}">
                + New Visit
              </button>
              <button class="btn btn-outline btn-sm" (click)="viewStudentVisits(student.student_id)">
                View All Visits
              </button>
            </div>

            <!-- Recent Visits Expandable -->
            <div class="recent-visits" *ngIf="student.recent_visits.length > 0">
              <div class="visits-header" (click)="toggleVisitsExpanded(student.student_id)">
                <span class="toggle-icon">{{ expandedStudents[student.student_id] ? '▼' : '▶' }}</span>
                <span>Recent Visits ({{ student.recent_visits.length }})</span>
              </div>
              <div class="visits-list" *ngIf="expandedStudents[student.student_id]">
                <div *ngFor="let visit of student.recent_visits.slice(0, 5)" class="visit-item">
                  <div class="visit-date">{{ formatDate(visit.visit_datetime) }}</div>
                  <div class="visit-type-small" [class]="'type-' + visit.visit_type?.toLowerCase()">{{ visit.visit_type }}</div>
                  <div class="visit-complaint">{{ visit.chief_complaint || visit.notes || 'No complaint' }}</div>
                  <div class="visit-status" [class]="'status-' + visit.status?.toLowerCase()">{{ visit.status }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Enhanced Medical Visits Styling - Updated */
    .visits-page {
      padding: 2rem;
      background: #f0f4f8;
      min-height: 100vh;
    }

    .page-header {
      margin-bottom: 2rem;
      background: linear-gradient(135deg, rgba(5, 35, 85, 0.95) 0%, rgba(83, 129, 178, 0.95) 100%);
      padding: 2.5rem 2.5rem;
      border-radius: 0 0 24px 24px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 2rem;

      .header-content {
        h1 {
          font-size: 2.5rem;
          color: #ffffff;
          margin-bottom: 0.5rem;
          font-weight: 700;
          line-height: 1.2;
        }

        p {
          color: rgba(255, 255, 255, 0.95);
          font-size: 1.1rem;
          margin: 0;
          line-height: 1.6;
        }
      }

      .btn {
        flex-shrink: 0;
      }
    }

    .btn {
      padding: 0.875rem 2rem;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 700;
      font-size: 0.95rem;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      &.btn-primary {
        background: white;
        color: #052355;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        &:hover {
          background: #eef4ff;
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.25);
        }
      }
      &.btn-outline {
        background: white;
        color: #052355;
        border: 2px solid #052355;
        &:hover {
          background: #052355;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(5, 35, 85, 0.2);
        }
      }
      &.btn-sm { padding: 0.75rem 1.5rem; font-size: 0.9rem; }
    }

    .loading-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      background: white;
      border-radius: 12px;
      text-align: center;

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #e9ecef;
        border-top: 4px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
      }

      .error-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      p {
        color: #6c757d;
        font-size: 1.1rem;
        margin-bottom: 1rem;
      }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .filters-section {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 300px;
      position: relative;

      .search-input {
        width: 100%;
        padding: 0.875rem 1.25rem 0.875rem 3rem;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        font-size: 0.95rem;
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        transition: all 0.2s ease;

        &:focus {
          outline: none;
          border-color: #052355;
          box-shadow: 0 4px 16px rgba(5, 35, 85, 0.1);
        }

        &::placeholder {
          color: #94a3b8;
        }
      }

      &::before {
        content: '🔍';
        position: absolute;
        left: 1.25rem;
        top: 50%;
        transform: translateY(-50%);
        font-size: 1rem;
        pointer-events: none;
      }
    }

    .filter-group {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .filter-input, .filter-select {
      padding: 0.875rem 1.25rem;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      font-size: 0.95rem;
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      transition: all 0.2s ease;
      min-width: 150px;

      &:focus {
        outline: none;
        border-color: #052355;
        box-shadow: 0 4px 16px rgba(5, 35, 85, 0.1);
      }
    }

    .card {
      background: transparent;
      border-radius: 0;
      padding: 0;
      box-shadow: none;
    }

    .no-visits-alert, .no-results-alert {
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
    }

    .student-summary-list {
      display: grid;
      gap: 1.5rem;
    }

    .student-summary-card {
      background: white;
      border: 1px solid rgba(5, 35, 85, 0.1);
      border-radius: 20px;
      padding: 2rem;
      transition: all 0.3s ease;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

      &:hover {
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        transform: translateY(-2px);
      }
    }

    .student-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid #e8f0f8;
      gap: 2rem;
    }

    .student-info {
      display: flex;
      align-items: center;
      gap: 1.25rem;

      .student-avatar {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(14, 165, 233, 0.3);
        flex-shrink: 0;

        .avatar-text {
          color: white;
          font-weight: 700;
          font-size: 1.5rem;
        }
      }

      .student-details {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .student-name {
        font-weight: 700;
        color: #0f172a;
        font-size: 1.3rem;
        text-transform: capitalize;
      }
      .student-number {
        font-size: 0.9rem;
        color: #64748b;
        font-weight: 500;
      }
      .student-grade {
        font-size: 0.9rem;
        color: #475569;
        font-weight: 600;
      }
    }

    .visit-stats {
      display: flex;
      gap: 2rem;

      .stat {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.25rem;

        .stat-label {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 500;
        }
        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #052355;
        }
      }
    }

    .student-body {
      margin-bottom: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .visit-info {
      display: flex;
      gap: 1rem;
      align-items: center;

      .info-label {
        color: #64748b;
        font-size: 0.95rem;
        font-weight: 600;
        min-width: 150px;
      }
      .info-value {
        color: #0f172a;
        font-size: 0.95rem;
        font-weight: 500;
      }
    }

    .visit-type-badge {
      padding: 0.4rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: capitalize;

      &.type-routine { background: #e3f2fd; color: #1565c0; }
      &.type-emergency { background: #ffebee; color: #c62828; }
    }

    .emergency-badge {
      background: #ffcdd2;
      color: #c62828;
      padding: 0.4rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .status-badge {
      padding: 0.4rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;

      &.status-open { background: #fff3cd; color: #856404; }
      &.status-closed { background: #d4edda; color: #155724; }
      &.status-referred { background: #f8d7da; color: #721c24; }
      &.status-cancelled { background: #f8d7da; color: #721c24; }
    }

    .student-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      flex-wrap: wrap;
    }

    .recent-visits {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e8f0f8;

      .visits-header {
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #0ea5e9;
        font-weight: 600;
        font-size: 0.95rem;
        padding: 0.5rem 0;
        transition: all 0.2s ease;

        &:hover {
          color: #0284c7;
        }

        .toggle-icon {
          display: inline-block;
          transition: transform 0.2s ease;
          font-size: 0.85rem;
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
        display: grid;
        grid-template-columns: 120px 100px 1fr 80px;
        gap: 1rem;
        padding: 0.5rem;
        background: #f8f9fa;
        border-radius: 6px;
        font-size: 0.85rem;
        align-items: center;

        .visit-date { color: #7f8c8d; }
        .visit-type-small {
          color: #2c3e50;
          font-weight: 500;
          padding: 0.2rem 0.5rem;
          border-radius: 8px;
          font-size: 0.75rem;
          text-align: center;

          &.type-routine { background: #e3f2fd; color: #1976d2; }
          &.type-emergency { background: #ffebee; color: #d32f2f; }
        }
        .visit-complaint { color: #495057; }
        .visit-status {
          font-size: 0.75rem;
          padding: 0.2rem 0.5rem;
          border-radius: 8px;
          text-align: center;

          &.status-open { background: #fff3cd; color: #856404; }
          &.status-closed { background: #d4edda; color: #155724; }
          &.status-referred { background: #f8d7da; color: #721c24; }
        }
      }
    }

    @media (max-width: 768px) {
      .visits-page { padding: 1rem; }
      .page-header { flex-direction: column; gap: 1rem; align-items: stretch; }
      .filters-section { flex-direction: column; }
      .filter-group { flex-wrap: wrap; }
      .student-header { flex-direction: column; gap: 1rem; align-items: stretch; }
      .visit-stats { justify-content: space-around; }
      .visit-item { grid-template-columns: 1fr; gap: 0.5rem; }
    }
  `]
})
export class VisitsListComponent implements OnInit {
  searchTerm = '';
  dateFilter = '';
  statusFilter = '';
  typeFilter = '';
  loading = true;
  error: string | null = null;

  allVisits: any[] = [];
  studentSummaries: StudentVisitSummary[] = [];
  filteredStudents: StudentVisitSummary[] = [];
  expandedStudents: { [key: number]: boolean } = {};

  constructor(
    private medicalVisitService: MedicalVisitService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadVisits();
  }

  loadVisits(): void {
    this.loading = true;
    this.error = null;

    const params: any = {};
    if (this.dateFilter) {
      params.date_from = this.dateFilter;
    }

    this.medicalVisitService.getAll(params).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.allVisits = response.data.data || [];
        } else {
          this.allVisits = [];
          this.error = response.message || 'Failed to load visits';
        }
        this.groupVisitsByStudent();
        this.filterVisits();
      },
      error: (err) => {
        // Error loading visits
        this.loading = false;
        this.error = 'Failed to load visits. Please try again.';
      }
    });
  }

  groupVisitsByStudent(): void {
    const studentMap = new Map<number, StudentVisitSummary>();

    this.allVisits.forEach((visit) => {
      const studentId = visit.student?.student_id;
      if (!studentId) return;

      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          student_id: studentId,
          student_name: visit.student?.user?.full_name || visit.student?.full_name || 'Unknown Student',
          student_number: visit.student?.student_number || 'N/A',
          grade_section: `${visit.student?.grade_level || ''} - ${visit.student?.section || ''}`.trim(),
          total_visits: 0,
          last_visit: null,
          recent_visits: []
        });
      }

      const summary = studentMap.get(studentId)!;
      summary.total_visits++;
      summary.recent_visits.push(visit);

      // Set latest visit info (visits should be sorted by date desc)
      if (!summary.last_visit) {
        summary.last_visit = {
          visit_id: visit.visit_id,
          visit_datetime: visit.visit_datetime,
          visit_type: visit.visit_type,
          chief_complaint: visit.chief_complaint || visit.notes || 'No complaint recorded',
          diagnosis: visit.diagnosis,
          status: visit.status,
          is_emergency: visit.visit_type === 'Emergency'
        };
      }
    });

    this.studentSummaries = Array.from(studentMap.values());
    // Sort by total visits (descending) then by last visit date
    this.studentSummaries.sort((a, b) => {
      if (a.total_visits !== b.total_visits) {
        return b.total_visits - a.total_visits;
      }
      if (a.last_visit && b.last_visit) {
        return new Date(b.last_visit.visit_datetime).getTime() - new Date(a.last_visit.visit_datetime).getTime();
      }
      return 0;
    });
  }

  filterVisits(): void {
    this.filteredStudents = this.studentSummaries.filter(student => {
      const matchesSearch = !this.searchTerm ||
        student.student_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        student.student_number.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus = !this.statusFilter ||
        (student.last_visit && student.last_visit.status === this.statusFilter);

      const matchesType = !this.typeFilter ||
        (student.last_visit && student.last_visit.visit_type === this.typeFilter);

      return matchesSearch && matchesStatus && matchesType;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.typeFilter = '';
    this.dateFilter = '';
    this.filterVisits();
  }

  toggleVisitsExpanded(studentId: number): void {
    this.expandedStudents[studentId] = !this.expandedStudents[studentId];
  }

  viewStudentVisits(studentId: number): void {
    this.router.navigate(['/dashboard/staff/students', studentId, 'visits']);
  }

  getStudentInitials(name: string): string {
    return name.split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getLastVisitDate(dateString?: string): string {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
