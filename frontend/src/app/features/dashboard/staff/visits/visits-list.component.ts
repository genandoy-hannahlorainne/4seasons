import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MedicalVisitService } from '../../../../core/services/medical-visit.service';
import { VisitFormComponent } from './visit-form.component';

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
  imports: [CommonModule, FormsModule, RouterModule, VisitFormComponent],
  template: `
    <div class="visits-page">
      <div class="page-header">
        <div class="header-content">
          <h1>Medical Visits</h1>
          <p>Student visit summary and records</p>
        </div>
        <button class="btn btn-primary" (click)="openNewVisitModal()">+ New Visit</button>
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

          <!-- Status dropdown -->
          <div class="custom-dropdown" [class.open]="statusDropdownOpen">
            <button type="button" class="dropdown-trigger" (click)="toggleStatusDropdown($event)">
              <span class="dropdown-label">
                <span class="dropdown-dot" [class]="'dot-' + (statusFilter || 'all').toLowerCase()"></span>
                {{ statusFilter || 'All Status' }}
              </span>
              <i class="bi bi-chevron-down dropdown-chevron"></i>
            </button>
            <div class="dropdown-panel" *ngIf="statusDropdownOpen">
              <button type="button" class="dropdown-option" [class.active]="statusFilter === ''" (click)="setStatus('')">
                <span class="dropdown-dot dot-all"></span> All Status
              </button>
              <button type="button" class="dropdown-option" [class.active]="statusFilter === 'Open'" (click)="setStatus('Open')">
                <span class="dropdown-dot dot-open"></span> Open
              </button>
              <button type="button" class="dropdown-option" [class.active]="statusFilter === 'Closed'" (click)="setStatus('Closed')">
                <span class="dropdown-dot dot-closed"></span> Closed
              </button>
              <button type="button" class="dropdown-option" [class.active]="statusFilter === 'Referred'" (click)="setStatus('Referred')">
                <span class="dropdown-dot dot-referred"></span> Referred
              </button>
            </div>
          </div>

          <!-- Type dropdown -->
          <div class="custom-dropdown" [class.open]="typeDropdownOpen">
            <button type="button" class="dropdown-trigger" (click)="toggleTypeDropdown($event)">
              <span class="dropdown-label">
                <i class="bi" [class.bi-clipboard2-check]="typeFilter !== 'Emergency'" [class.bi-heart-pulse]="typeFilter === 'Emergency'"></i>
                {{ typeFilter || 'All Types' }}
              </span>
              <i class="bi bi-chevron-down dropdown-chevron"></i>
            </button>
            <div class="dropdown-panel" *ngIf="typeDropdownOpen">
              <button type="button" class="dropdown-option" [class.active]="typeFilter === ''" (click)="setType('')">
                <i class="bi bi-clipboard2-check"></i> All Types
              </button>
              <button type="button" class="dropdown-option" [class.active]="typeFilter === 'Routine'" (click)="setType('Routine')">
                <i class="bi bi-clipboard2-check"></i> Routine
              </button>
              <button type="button" class="dropdown-option" [class.active]="typeFilter === 'Emergency'" (click)="setType('Emergency')">
                <i class="bi bi-heart-pulse"></i> Emergency
              </button>
            </div>
          </div>
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
          <button class="btn btn-primary" (click)="openNewVisitModal()">
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

            <!-- Card Header -->
            <div class="card-header-strip" [class.emergency-strip]="student.last_visit?.is_emergency"></div>
            <div class="student-header">
              <div class="student-info">
                <div class="student-avatar">
                  <span class="avatar-text">{{ getStudentInitials(student.student_name) }}</span>
                </div>
                <div class="student-details">
                  <span class="student-name">{{ student.student_name }}</span>
                  <div class="student-meta">
                    <span class="meta-chip"><i class="bi bi-person-badge"></i> {{ student.student_number }}</span>
                    <span class="meta-chip"><i class="bi bi-mortarboard"></i> {{ student.grade_section }}</span>
                  </div>
                </div>
              </div>
              <div class="visit-stats">
                <div class="stat-pill">
                  <i class="bi bi-clipboard2-pulse"></i>
                  <div>
                    <span class="stat-value">{{ student.total_visits }}</span>
                    <span class="stat-label">Total Visits</span>
                  </div>
                </div>
                <div class="stat-pill">
                  <i class="bi bi-clock-history"></i>
                  <div>
                    <span class="stat-value small">{{ getLastVisitDate(student.last_visit?.visit_datetime) }}</span>
                    <span class="stat-label">Last Visit</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Latest Visit Record -->
            <div class="latest-visit-section" *ngIf="student.last_visit">
              <div class="section-label"><i class="bi bi-file-medical"></i> Latest Visit Record</div>
              <div class="visit-record-grid">
                <div class="record-field">
                  <span class="field-label">Visit Type</span>
                  <span class="visit-type-badge" [class]="'type-' + student.last_visit.visit_type.toLowerCase()">
                    <i class="bi" [class.bi-heart-pulse]="student.last_visit.is_emergency" [class.bi-clipboard2-check]="!student.last_visit.is_emergency"></i>
                    {{ student.last_visit.visit_type }}
                  </span>
                </div>
                <div class="record-field">
                  <span class="field-label">Status</span>
                  <span class="status-badge" [class]="'status-' + student.last_visit.status.toLowerCase()">{{ student.last_visit.status }}</span>
                </div>
                <div class="record-field full-width">
                  <span class="field-label">Chief Complaint</span>
                  <span class="field-value">{{ student.last_visit.chief_complaint }}</span>
                </div>
                <div class="record-field full-width" *ngIf="student.last_visit.diagnosis">
                  <span class="field-label">Diagnosis</span>
                  <span class="field-value">{{ student.last_visit.diagnosis }}</span>
                </div>
              </div>
            </div>

            <!-- Actions + Expand -->
            <div class="card-footer">
              <div class="student-actions">
                <button class="btn btn-outline btn-sm" [routerLink]="['/dashboard/staff/students', student.student_id]">
                  <i class="bi bi-person"></i> View Profile
                </button>
                <button class="btn btn-primary btn-sm" (click)="openNewVisitModal(student.student_id)">
                  <i class="bi bi-plus-circle"></i> New Visit
                </button>
              </div>
              <button class="expand-btn" (click)="openHistoryModal(student)" *ngIf="student.recent_visits.length > 0">
                <i class="bi bi-clock-history"></i>
                Visit History ({{ student.recent_visits.length }})
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- New Visit Modal -->
    @if (showNewVisitModal) {
    <div class="modal-overlay new-visit-modal" (click)="closeNewVisitModal()">
      <div class="new-visit-modal-box" (click)="$event.stopPropagation()">
        <app-visit-form
          [preselectedStudentId]="newVisitStudentId"
          [isModal]="true"
          (visitSaved)="onVisitSaved()"
          (cancelled)="closeNewVisitModal()">
        </app-visit-form>
      </div>
    </div>
    }

    <!-- Visit History Modal -->
    <div class="modal-overlay" *ngIf="historyModal" (click)="closeHistoryModal()">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="modal-student-info">
            <div class="modal-avatar">{{ getStudentInitials(historyModal.student_name) }}</div>
            <div>
              <div class="modal-student-name">{{ historyModal.student_name }}</div>
              <div class="modal-student-meta">
                <span><i class="bi bi-person-badge"></i> {{ historyModal.student_number }}</span>
                <span><i class="bi bi-mortarboard"></i> {{ historyModal.grade_section }}</span>
              </div>
            </div>
          </div>
          <button class="modal-close" (click)="closeHistoryModal()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="modal-body">
          <table class="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Chief Complaint</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let visit of historyModal.recent_visits">
                <td class="td-date">{{ formatDate(visit.visit_datetime) }}</td>
                <td><span class="visit-type-badge sm" [class]="'type-' + visit.visit_type?.toLowerCase()">{{ visit.visit_type }}</span></td>
                <td class="td-complaint">{{ visit.chief_complaint || visit.notes || '—' }}</td>
                <td><span class="status-badge" [class]="'status-' + visit.status?.toLowerCase()">{{ visit.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Enhanced Medical Visits Styling - Updated */
    .visits-page {
      padding: 2rem;
      background: radial-gradient(1200px 600px at 15% 0%, rgba(37, 99, 235, 0.10), transparent 55%), #f6f7fb;
      min-height: 100vh;
    }

    .page-header {
      margin-bottom: 2rem;
      background: linear-gradient(135deg, rgba(5, 35, 85, 0.96) 0%, rgba(83, 129, 178, 0.96) 100%);
      padding: 2.5rem 2.5rem;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(5, 35, 85, 0.2);
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
      border: 1px solid transparent;
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
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.16);
        &:hover {
          background: #eef4ff;
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
        }
      }
      &.btn-outline {
        background: white;
        color: #052355;
        border: 1.5px solid #cbd5e1;
        &:hover {
          background: #eff6ff;
          color: #052355;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.12);
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
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        font-size: 0.95rem;
        background: white;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        transition: all 0.2s ease;

        &:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
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
      align-items: center;
    }

    .filter-input {
      padding: 0.875rem 1.25rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      font-size: 0.95rem;
      background: white;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      transition: all 0.2s ease;
      min-width: 150px;

      &:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
      }
    }

    /* ── Custom Dropdown ── */
    .custom-dropdown {
      position: relative;
    }

    .dropdown-trigger {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.875rem 1.1rem;
      background: white;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      color: #0f172a;
      cursor: pointer;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      transition: border-color 0.2s, box-shadow 0.2s;
      min-width: 140px;
      justify-content: space-between;

      &:hover {
        border-color: #93c5fd;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
      }
    }

    .custom-dropdown.open .dropdown-trigger {
      border-color: #3b82f6;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
    }

    .dropdown-label {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .dropdown-chevron {
      font-size: 0.75rem;
      color: #94a3b8;
      transition: transform 0.2s ease;
    }

    .custom-dropdown.open .dropdown-chevron {
      transform: rotate(180deg);
    }

    .dropdown-panel {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      min-width: 100%;
      background: white;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
      z-index: 200;
      overflow: hidden;
      animation: dropdownIn 0.15s ease;
    }

    @keyframes dropdownIn {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .dropdown-option {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      width: 100%;
      padding: 0.7rem 1rem;
      background: none;
      border: none;
      font-size: 0.9rem;
      font-weight: 500;
      color: #334155;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s;

      &:hover {
        background: #f1f5f9;
        color: #052355;
      }

      &.active {
        background: #1d4ed8;
        color: white;
        font-weight: 700;

        .dropdown-dot { border-color: rgba(255,255,255,0.6); }
      }

      i { font-size: 0.85rem; }
    }

    /* Status dots */
    .dropdown-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      border: 1.5px solid transparent;

      &.dot-all      { background: #94a3b8; }
      &.dot-open     { background: #f59e0b; }
      &.dot-closed   { background: #22c55e; }
      &.dot-referred { background: #3b82f6; }
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
      gap: 1.25rem;
    }

    .student-summary-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
      transition: box-shadow 0.2s ease, transform 0.2s ease;

      &:hover {
        box-shadow: 0 6px 24px rgba(5,35,85,0.1);
        transform: translateY(-2px);
      }
    }

    .card-header-strip {
      height: 4px;
      background: linear-gradient(90deg, #052355, #5381b2);
      &.emergency-strip { background: linear-gradient(90deg, #c62828, #ef5350); }
    }

    .student-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .student-info {
      display: flex;
      align-items: center;
      gap: 1rem;

      .student-avatar {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: linear-gradient(135deg, #052355, #5381b2);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        .avatar-text {
          color: white;
          font-weight: 700;
          font-size: 1.1rem;
          letter-spacing: 0.5px;
        }
      }

      .student-details {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .student-name {
        font-weight: 700;
        font-size: 1.05rem;
        color: #0f172a;
        text-transform: capitalize;
      }

      .student-meta {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .meta-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.78rem;
        font-weight: 500;
        color: #475569;
        background: #f1f5f9;
        padding: 0.2rem 0.6rem;
        border-radius: 20px;

        i { font-size: 0.75rem; color: #5381b2; }
      }
    }

    .visit-stats {
      display: flex;
      gap: 0.75rem;

      .stat-pill {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 0.5rem 0.9rem;

        > i {
          font-size: 1.2rem;
          color: #5381b2;
        }

        > div {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: #052355;
          line-height: 1;

          &.small { font-size: 0.82rem; }
        }

        .stat-label {
          font-size: 0.72rem;
          color: #94a3b8;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
      }
    }

    .latest-visit-section {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;

      .section-label {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: #94a3b8;
        margin-bottom: 0.75rem;
        display: flex;
        align-items: center;
        gap: 0.4rem;

        i { color: #5381b2; }
      }
    }

    .visit-record-grid {
      display: grid;
      grid-template-columns: 160px 160px 1fr 1fr;
      gap: 0.5rem 2rem;
      align-items: start;

      .record-field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        &.full-width { grid-column: 3 / -1; }
      }

      .field-label {
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        color: #94a3b8;
      }

      .field-value {
        font-size: 0.9rem;
        color: #1e293b;
        font-weight: 500;
      }
    }

    .visit-type-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.3rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;

      &.sm { padding: 0.2rem 0.55rem; font-size: 0.75rem; }
      &.type-routine { background: #eff6ff; color: #1d4ed8; }
      &.type-emergency { background: #fff1f2; color: #be123c; }
    }

    .status-badge {
      display: inline-block;
      padding: 0.3rem 0.75rem;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 600;
      text-transform: capitalize;

      &.status-open { background: #fefce8; color: #a16207; border: 1px solid #fde047; }
      &.status-closed { background: #f0fdf4; color: #15803d; border: 1px solid #86efac; }
      &.status-referred { background: #eff6ff; color: #1d4ed8; border: 1px solid #93c5fd; }
      &.status-cancelled { background: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; }
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.9rem 1.5rem;
      background: #fafbfc;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .student-actions {
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
    }

    .expand-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: none;
      border: 1.5px solid #cbd5e1;
      border-radius: 12px;
      padding: 0.4rem 0.9rem;
      font-size: 0.82rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s;

      &:hover { background: #f1f5f9; border-color: #94a3b8; color: #052355; }
      i { font-size: 0.8rem; }
    }

    /* ── Visit History Modal ── */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      backdrop-filter: blur(3px);
      animation: fadeIn 0.18s ease;
    }

    .modal-box {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 680px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 24px 60px rgba(0,0,0,0.25);
      animation: slideUp 0.22s ease;
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
      gap: 1rem;
    }

    .modal-student-info {
      display: flex;
      align-items: center;
      gap: 0.9rem;
    }

    .modal-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, #052355, #5381b2);
      color: white;
      font-weight: 700;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .modal-student-name {
      font-weight: 700;
      font-size: 1rem;
      color: #0f172a;
      text-transform: capitalize;
    }

    .modal-student-meta {
      display: flex;
      gap: 0.75rem;
      font-size: 0.78rem;
      color: #64748b;
      margin-top: 0.2rem;

      i { color: #5381b2; margin-right: 0.2rem; }
    }

    .modal-close {
      background: #f1f5f9;
      border: none;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      flex-shrink: 0;
      transition: background 0.2s;

      &:hover { background: #e2e8f0; color: #0f172a; }
      i { font-size: 0.85rem; }
    }

    .modal-body {
      overflow-y: auto;
      padding: 1rem 1.5rem 1.5rem;
      -webkit-overflow-scrolling: touch;
    }

    .new-visit-modal { align-items: flex-start; padding-top: 2rem; }

    .new-visit-modal-box {
      position: relative;
      width: 100%;
      max-width: 860px;
      max-height: 90vh;
      overflow-y: auto;
      border-radius: 16px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.3);
      animation: slideUp 0.22s ease;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    .history-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;

      thead tr {
        background: #f8fafc;
        border-bottom: 2px solid #e2e8f0;
      }

      th {
        padding: 0.6rem 0.75rem;
        text-align: left;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #64748b;
      }

      td {
        padding: 0.6rem 0.75rem;
        border-bottom: 1px solid #f1f5f9;
        color: #334155;
        vertical-align: middle;

        &.td-date { color: #64748b; white-space: nowrap; }
        &.td-complaint { max-width: 260px; }
      }

      tbody tr:last-child td { border-bottom: none; }
      tbody tr:hover td { background: #f8fafc; }
    }

    @media (max-width: 768px) {
      .visits-page { padding: 1rem; }
      .page-header { flex-direction: column; gap: 1rem; align-items: stretch; }
      .filters-section { flex-direction: column; }
      .filter-group { flex-wrap: wrap; }
      .student-header { flex-direction: column; align-items: flex-start; }
      .visit-stats { width: 100%; justify-content: flex-start; }
      .visit-record-grid { grid-template-columns: 1fr 1fr; }
      .visit-record-grid .record-field.full-width { grid-column: 1 / -1; }
      .card-footer { flex-direction: column; align-items: flex-start; }
      .history-table th:nth-child(2), .history-table td:nth-child(2) { display: none; }
    }
  `]
})
export class VisitsListComponent implements OnInit, OnDestroy {
  searchTerm = '';
  dateFilter = '';
  statusFilter = '';
  typeFilter = '';
  statusDropdownOpen = false;
  typeDropdownOpen = false;
  loading = true;
  error: string | null = null;

  allVisits: any[] = [];
  studentSummaries: StudentVisitSummary[] = [];
  filteredStudents: StudentVisitSummary[] = [];
  historyModal: StudentVisitSummary | null = null;
  showNewVisitModal = false;
  newVisitStudentId: number | null = null;

  constructor(
    private medicalVisitService: MedicalVisitService,
    private router: Router
  ) {}

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

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

  @HostListener('document:click')
  onDocumentClick(): void {
    this.statusDropdownOpen = false;
    this.typeDropdownOpen = false;
  }

  toggleStatusDropdown(e: Event): void {
    e.stopPropagation();
    this.typeDropdownOpen = false;
    this.statusDropdownOpen = !this.statusDropdownOpen;
  }

  toggleTypeDropdown(e: Event): void {
    e.stopPropagation();
    this.statusDropdownOpen = false;
    this.typeDropdownOpen = !this.typeDropdownOpen;
  }

  setStatus(value: string): void {
    this.statusFilter = value;
    this.statusDropdownOpen = false;
    this.filterVisits();
  }

  setType(value: string): void {
    this.typeFilter = value;
    this.typeDropdownOpen = false;
    this.filterVisits();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.typeFilter = '';
    this.dateFilter = '';
    this.filterVisits();
  }

  openNewVisitModal(studentId?: number): void {
    this.newVisitStudentId = studentId ?? null;
    this.showNewVisitModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeNewVisitModal(): void {
    this.showNewVisitModal = false;
    this.newVisitStudentId = null;
    document.body.style.overflow = '';
  }

  onVisitSaved(): void {
    this.closeNewVisitModal();
    this.loadVisits();
  }

  openHistoryModal(student: StudentVisitSummary): void {
    this.historyModal = student;
    document.body.style.overflow = 'hidden';
  }

  closeHistoryModal(): void {
    this.historyModal = null;
    document.body.style.overflow = '';
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
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Today';
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
