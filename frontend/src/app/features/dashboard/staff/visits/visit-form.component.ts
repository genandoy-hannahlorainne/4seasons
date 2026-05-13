import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { QrScannerComponent } from './qr-scanner.component';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-visit-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, QrScannerComponent],
  template: `
    <div class="visit-form-page" [class.modal-mode]="isModal">
      <div class="page-header">
        <button class="back-btn" *ngIf="!isModal" routerLink="/dashboard/staff/visits">← Back to Visits</button>
        <div class="header-title-row">
          <h1>{{ isEditMode ? 'Edit Visit' : 'New Medical Visit' }}</h1>
          <button type="button" class="modal-close-btn" *ngIf="isModal" (click)="onCancel()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>

      <!-- QR Scanner Modal -->
      <div class="modal-overlay" *ngIf="showScanner" (click)="closeScanner()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <app-qr-scanner
            (scanned)="onQrScanned($event)"
            (cancelled)="closeScanner()">
          </app-qr-scanner>
        </div>
      </div>

      <form class="visit-form" (ngSubmit)="onSubmit()">
        <!-- Student Selection -->
        <div class="form-section">
          <h3><i class="bi bi-person-badge"></i> Student Information</h3>
          <div class="section-body">

          <!-- Scan QR Button -->
          <div class="scan-section" *ngIf="!selectedStudent">
            <div class="scan-icon"><i class="bi bi-qr-code-scan"></i></div>
            <span class="scan-label">Quick Student Lookup</span>
            <button type="button" class="btn-scan" (click)="openScanner()">
              <i class="bi bi-camera"></i> Scan QR Code
            </button>
            <span class="or-divider">or search manually</span>
          </div>

          <div class="form-group" *ngIf="!selectedStudent">
            <label>Search Student</label>
            <input
              type="text"
              [(ngModel)]="studentSearch"
              name="studentSearch"
              placeholder="Enter student number or name"
              class="form-control"
              (ngModelChange)="searchStudent()">
            <div class="search-loading" *ngIf="searchLoading">Searching...</div>
            <div class="search-results" *ngIf="searchResults.length > 0">
              <div *ngFor="let result of searchResults" class="search-result" (click)="selectStudent(result)">
                {{ result.full_name }} ({{ result.student_number }}) - {{ result.grade_section }}
              </div>
            </div>
            <div class="no-results" *ngIf="studentSearch.length >= 2 && searchResults.length === 0 && !searchLoading && searchDone">
              No students found
            </div>
          </div>

          <!-- Selected Student Card -->
          <div class="selected-student" *ngIf="selectedStudent">
            <div class="student-avatar-initials">{{ getInitials(selectedStudent.full_name) }}</div>
            <div class="student-info">
              <span class="student-name">{{ selectedStudent.full_name }}</span>
              <span class="student-details">{{ selectedStudent.student_number }} | {{ selectedStudent.grade_section }}</span>

              <!-- Medical Clearance Status -->
              <div class="clearance-status" *ngIf="selectedStudent.clearance">
                <div class="clearance-badge" [ngClass]="'clearance-' + selectedStudent.clearance.level">
                  <span class="clearance-icon">
                    <span *ngIf="selectedStudent.clearance.level === 'green'">✓</span>
                    <span *ngIf="selectedStudent.clearance.level === 'yellow'">⚠</span>
                    <span *ngIf="selectedStudent.clearance.level === 'red'">⚠</span>
                  </span>
                  <span class="clearance-text">{{ selectedStudent.clearance.message }}</span>
                </div>
                <div class="clearance-warnings" *ngIf="selectedStudent.clearance.warnings && selectedStudent.clearance.warnings.length > 0">
                  <span *ngFor="let warning of selectedStudent.clearance.warnings" class="warning-tag">{{ warning }}</span>
                </div>
              </div>

              <div class="student-allergies" *ngIf="selectedStudent.allergies && selectedStudent.allergies.length > 0">
                <span class="allergy-label">⚠️ Allergies:</span>
                <span class="allergy-tags">
                  <span *ngFor="let allergy of selectedStudent.allergies" class="allergy-tag">{{ allergy }}</span>
                </span>
              </div>
            </div>
            <button type="button" class="btn-clear" (click)="clearStudent()">×</button>
          </div>

          <!-- Clearance Alert for Off-Campus Activities -->
          <div class="clearance-alert" *ngIf="selectedStudent && selectedStudent.clearance && selectedStudent.clearance.level === 'red'">
            <div class="alert-header">
              <span class="alert-icon">🚨</span>
              <span class="alert-title">MEDICAL CLEARANCE REQUIRED</span>
            </div>
            <div class="alert-body">
              <p>{{ selectedStudent.clearance.message }}</p>
              <p><strong>Action Required:</strong> Student cannot participate in off-campus activities until clearance is obtained.</p>
              <div class="emergency-contact" *ngIf="selectedStudent.emergency_contact">
                <strong>Emergency Contact:</strong> {{ selectedStudent.emergency_contact.name }} - {{ selectedStudent.emergency_contact.phone }}
              </div>
            </div>
          </div>
          </div>
        </div>

        <!-- Visit Details -->
        <div class="form-section">
          <h3><i class="bi bi-calendar2-check"></i> Visit Details</h3>
          <div class="section-body">
          <div class="form-row">
            <div class="form-group">
              <label>Date & Time *</label>
              <input type="datetime-local" [(ngModel)]="visit.dateTime" name="dateTime" class="form-control" required>
            </div>
            <div class="form-group">
              <label>Visit Type *</label>
              <select [(ngModel)]="visit.visitType" name="visitType" class="form-control" required (ngModelChange)="onVisitTypeChange()">
                <option value="">Select type</option>
                <option value="routine">Routine</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>
          </div>
        </div>

        <!-- Vitals -->
        <div class="form-section">
          <h3><i class="bi bi-heart-pulse"></i> Vital Signs</h3>
          <div class="section-body">
          <div class="form-row vitals-row">
            <div class="form-group">
              <label>Temperature (°C)</label>
              <input type="number" step="0.1" [(ngModel)]="visit.vitals.temperature" name="temperature" class="form-control" placeholder="36.5">
            </div>
            <div class="form-group">
              <label>Blood Pressure</label>
              <input type="text" [(ngModel)]="visit.vitals.bloodPressure" name="bloodPressure" class="form-control" placeholder="120/80">
            </div>
            <div class="form-group">
              <label>Pulse Rate (bpm)</label>
              <input type="number" [(ngModel)]="visit.vitals.pulseRate" name="pulseRate" class="form-control" placeholder="72">
            </div>
          </div>
          </div>
        </div>

        <!-- Assessment & Treatment -->
        <div class="form-section">
          <h3><i class="bi bi-clipboard2-pulse"></i> Assessment &amp; Treatment</h3>
          <div class="section-body">
          <div class="form-group">
            <label>Diagnosis Category *</label>
            <select [(ngModel)]="visit.diagnosis" name="diagnosis" class="form-control" required>
              <option value="">Select diagnosis category</option>
              <option value="Fever">Fever</option>
              <option value="Cough">Cough</option>
              <option value="Headache">Headache</option>
              <option value="Sore Throat">Sore Throat</option>
              <option value="Stomach Ache">Stomach Ache</option>
              <option value="Diarrhea">Diarrhea</option>
              <option value="Vomiting">Vomiting</option>
              <option value="Rash">Rash</option>
              <option value="Injury">Injury</option>
              <option value="Allergy">Allergy</option>
              <option value="Asthma">Asthma</option>
              <option value="Diabetes">Diabetes</option>
              <option value="Hypertension">Hypertension</option>
              <option value="Other">Other</option>
            </select>
          </div>
          </div>
        </div>

        <!-- Status & Notification -->
        <div class="form-section">
          <h3><i class="bi bi-bell"></i> Status &amp; Notification</h3>
          <div class="section-body">
          <div class="form-row">
            <div class="form-group">
              <label>Visit Status *</label>
              <select [(ngModel)]="visit.status" name="status" class="form-control" required>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="referred">Referred to Hospital</option>
              </select>
            </div>
          </div>
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="visit.notifyParent" name="notifyParent" [disabled]="visit.visitType === 'emergency'">
              <span>Notify Parent/Guardian via SMS</span>
              <span class="auto-checked-badge" *ngIf="visit.visitType === 'emergency'">Auto-enabled for Emergency</span>
            </label>
            <div class="parent-phone" *ngIf="visit.notifyParent && selectedStudent?.parentPhone">
              <small>SMS will be sent to: {{ selectedStudent.parentPhone }}</small>
            </div>
            <div class="parent-phone warning" *ngIf="visit.notifyParent && !selectedStudent?.parentPhone">
              <small>⚠️ No parent phone number on file for this student</small>
            </div>
            <div class="emergency-notice" *ngIf="visit.visitType === 'emergency'">
              <small>🚨 Emergency visits automatically notify admin and parents</small>
            </div>
          </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="onCancel()">Cancel</button>
          <button type="submit" class="btn btn-primary" [disabled]="loading || !selectedStudent">
            {{ loading ? 'Saving...' : (isEditMode ? 'Update Visit' : 'Save Visit') }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .visit-form-page {
      padding: 2rem;
      background: #f0f4f8;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;

      &.modal-mode {
        min-height: unset;
        padding: 0;
        background: #f0f4f8;
        border-radius: 16px;
        overflow: hidden;
      }
    }

    .page-header {
      width: 100%;
      max-width: 800px;
      margin-bottom: 1.5rem;
      background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
      padding: 2rem 2rem 1.5rem;
      border-radius: 0 0 24px 24px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      box-sizing: border-box;

      .modal-mode & {
        border-radius: 0;
        margin-bottom: 0;
        max-width: 100%;
        padding: 1.4rem 1.75rem;
        box-shadow: none;
      }

      .back-btn {
        background: rgba(255,255,255,0.15);
        border: 1.5px solid rgba(255,255,255,0.5);
        color: #fff;
        cursor: pointer;
        font-size: 0.88rem;
        margin-bottom: 0.75rem;
        padding: 0.45rem 1rem;
        border-radius: 6px;
        transition: all 0.2s;
        display: inline-block;
        &:hover { background: rgba(255,255,255,0.25); }
      }

      .header-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }

      h1 {
        font-size: 1.5rem;
        color: #fff;
        font-weight: 700;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        &::before { content: '🏥'; font-size: 1.2rem; }
      }
    }

    .modal-close-btn {
      background: rgba(255,255,255,0.15);
      border: 1.5px solid rgba(255,255,255,0.4);
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s;
      &:hover { background: rgba(255,255,255,0.3); border-color: white; transform: scale(1.05); }
      i { font-size: 0.85rem; }
    }

    .visit-form {
      width: 100%;
      max-width: 800px;

      .modal-mode & {
        max-width: 100%;
        padding: 1.5rem;
        box-sizing: border-box;
      }
    }

    .form-section {
      background: white;
      border-radius: 12px;
      padding: 0;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07);
      border: 1px solid #e2e8f0;
      overflow: hidden;

      h3 {
        color: #052355;
        margin: 0;
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        padding: 0.85rem 1.5rem;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        i { color: #5381b2; font-size: 0.9rem; }
      }
    }

    .section-body {
      padding: 1.25rem 1.5rem;
    }

    .scan-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 2rem 1.5rem;
      background: #f8fafc;
      border: 1.5px dashed #b6c8e0;
      border-radius: 10px;
      margin-bottom: 1.25rem;

      .scan-icon {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #052355, #5381b2);
        display: flex;
        align-items: center;
        justify-content: center;
        i { font-size: 1.5rem; color: #fff; }
      }

      .scan-label {
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: #94a3b8;
      }

      .btn-scan {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.7rem 1.75rem;
        font-size: 0.95rem;
        font-weight: 600;
        background: #052355;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        letter-spacing: 0.2px;
        &:hover { background: #021535; box-shadow: 0 4px 12px rgba(5,35,85,0.25); }
        i { font-size: 1rem; }
      }

      .or-divider {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        max-width: 320px;
        color: #94a3b8;
        font-size: 0.8rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        &::before, &::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }
      }
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;

      &.vitals-row { grid-template-columns: repeat(4, 1fr); }
    }

    .form-group {
      margin-bottom: 1rem;
      position: relative;

      label {
        display: block;
        margin-bottom: 0.4rem;
        font-size: 0.82rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        color: #475569;
      }

      .form-control {
        width: 100%;
        padding: 0.65rem 0.9rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.92rem;
        color: #0f172a;
        box-sizing: border-box;
        background: #fff;
        transition: border-color 0.2s, box-shadow 0.2s;
        &:focus { outline: none; border-color: #052355; box-shadow: 0 0 0 3px rgba(5,35,85,0.08); }
      }

      textarea.form-control { resize: vertical; }
    }

    .search-results {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      max-height: 200px;
      overflow-y: auto;

      .search-result {
        padding: 0.75rem 1rem;
        cursor: pointer;
        border-bottom: 1px solid #f0f0f0;
        &:hover { background: #e3f2fd; }
        &:last-child { border-bottom: none; }
      }
    }

    .search-loading, .no-results {
      padding: 0.75rem 1rem;
      color: #7f8c8d;
      font-size: 0.9rem;
      background: white;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      margin-top: 0.25rem;
    }

    .selected-student {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: #eff6ff;
      border-radius: 10px;
      border: 1.5px solid #93c5fd;

      .student-avatar-initials {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #052355, #5381b2);
        color: white;
        font-weight: 700;
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        letter-spacing: 0.5px;
      }
      .student-info { flex: 1; display: flex; flex-direction: column; gap: 0.3rem; }
      .student-name { font-weight: 700; color: #052355; font-size: 1rem; }
      .student-details { font-size: 0.82rem; color: #475569; font-weight: 500; }

      .student-allergies {
        margin-top: 0.5rem;
        .allergy-label { color: #856404; font-weight: 500; font-size: 0.85rem; }
        .allergy-tags { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.25rem; }
        .allergy-tag {
          background: #fff3cd;
          color: #856404;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
        }
      }

      .btn-clear {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #6c757d;
        cursor: pointer;
        &:hover { color: #dc3545; }
      }
    }

    .clearance-status {
      margin-top: 0.5rem;

      .clearance-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: 500;

        &.clearance-green {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        &.clearance-yellow {
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }

        &.clearance-red {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
      }

      .clearance-warnings {
        margin-top: 0.5rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;

        .warning-tag {
          background: #fff3cd;
          color: #856404;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          border: 1px solid #ffeaa7;
        }
      }
    }

    .clearance-alert {
      background: #f8d7da;
      border: 2px solid #dc3545;
      border-radius: 8px;
      padding: 1rem;
      margin-top: 1rem;

      .alert-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;

        .alert-icon { font-size: 1.2rem; }
        .alert-title {
          font-weight: 700;
          color: #721c24;
          font-size: 0.95rem;
        }
      }

      .alert-body {
        color: #721c24;

        p { margin: 0 0 0.5rem; font-size: 0.9rem; }

        .emergency-contact {
          margin-top: 0.75rem;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          font-size: 0.85rem;
        }
      }
    }

    .checkbox-group {
      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;

        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          &:disabled { cursor: not-allowed; opacity: 0.6; }
        }
        span { color: #2c3e50; }

        .auto-checked-badge {
          background: #dc3545;
          color: white;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-left: 0.5rem;
        }
      }

      .parent-phone {
        margin-top: 0.5rem;
        padding: 0.5rem;
        background: #d4edda;
        border-radius: 4px;
        small { color: #155724; }

        &.warning {
          background: #fff3cd;
          small { color: #856404; }
        }
      }

      .emergency-notice {
        margin-top: 0.5rem;
        padding: 0.75rem;
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        small {
          color: #721c24;
          font-weight: 500;
        }
      }
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;

      .modal-mode & {
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        padding: 1rem 1.5rem;
        margin: 0 -1.5rem -1.5rem;
        border-radius: 0 0 16px 16px;
      }
    }

    .btn {
      padding: 0.7rem 1.5rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;

      &.btn-primary { background: #052355; color: white; &:hover { background: #021535; } }
      &.btn-secondary { background: white; color: #475569; border: 1.5px solid #cbd5e1; &:hover { background: #f1f5f9; } }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      max-width: 500px;
      width: 90%;
    }

    @media (max-width: 768px) {
      .visit-form-page { padding: 1rem; }
      .form-row { grid-template-columns: 1fr; }
      .form-row.vitals-row { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class VisitFormComponent implements OnInit, OnDestroy {
  @Input() preselectedStudentId: number | null = null;
  @Input() isModal = false;
  @Output() visitSaved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  isEditMode = false;
  loading = false;
  showScanner = false;
  studentSearch = '';
  searchResults: any[] = [];
  selectedStudent: any = null;
  searchLoading = false;
  searchDone = false;
  private searchTimeout: any = null;
  private clockInterval: any = null;

  visit = {
    dateTime: '',
    visitType: '',
    vitals: {
      temperature: null as number | null,
      bloodPressure: '',
      pulseRate: null as number | null
    },
    diagnosis: '',
    status: 'pending',
    notifyParent: false
  };

  // Watch for visit type changes to auto-check notify parent for emergency
  onCancel(): void {
    if (this.cancelled.observed) {
      this.cancelled.emit();
    } else {
      this.router.navigate(['/dashboard/staff/visits']);
    }
  }

  onVisitTypeChange(): void {
    if (this.visit.visitType === 'emergency') {
      this.visit.notifyParent = true;
    }
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const visitId = this.route.snapshot.paramMap.get('id');
    if (visitId && visitId !== 'new') {
      this.isEditMode = true;
      // Load visit data
    }

    // Set default datetime to now (local time) and keep it live
    this.visit.dateTime = this.getLocalDateTimeString();
    this.clockInterval = setInterval(() => {
      if (!this.isEditMode) {
        this.visit.dateTime = this.getLocalDateTimeString();
      }
    }, 1000);

    // Check if studentId is passed via @Input (modal mode) or query params (page mode)
    const studentId = this.preselectedStudentId ?? (this.route.snapshot.queryParamMap.get('studentId') ? parseInt(this.route.snapshot.queryParamMap.get('studentId')!) : null);
    if (studentId) {
      this.loadStudentById(studentId);
    }
  }

  openScanner(): void {
    this.showScanner = true;
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  private getLocalDateTimeString(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  closeScanner(): void {
    this.showScanner = false;
  }

  onQrScanned(qrData: any): void {
    // QR Data received
    this.closeScanner();

    // Extract student_id from QR data
    if (qrData && qrData.student_id) {
      this.loadStudentById(qrData.student_id);
    } else if (qrData && qrData.student_number) {
      this.loadStudentByNumber(qrData.student_number);
    } else {
      // Invalid QR data - no student_id or student_number found
    }
  }

  loadStudentById(studentId: number): void {
    this.loading = true;
    this.http.get(`${environment.apiUrl}/students/qr/lookup?student_id=${studentId}`)
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data.student) {
            this.selectedStudent = this.normalizeStudentData(response.data.student);
          } else {
            // Failed to load student
            alert('Student not found');
          }
          this.loading = false;
        },
        error: (error) => {
          // Error loading student
          alert('Failed to load student information');
          this.loading = false;
        }
      });
  }

  loadStudentByNumber(studentNumber: string): void {
    this.loading = true;
    this.http.get(`${environment.apiUrl}/students/qr/lookup?student_number=${studentNumber}`)
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data.student) {
            this.selectedStudent = this.normalizeStudentData(response.data.student);
          } else {
            // Failed to load student
            alert('Student not found');
          }
          this.loading = false;
        },
        error: (error) => {
          // Error loading student
          alert('Failed to load student information');
          this.loading = false;
        }
      });
  }

  searchStudent(): void {
    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    if (this.studentSearch.length < 2) {
      this.searchResults = [];
      this.searchDone = false;
      this.searchLoading = false;
      return;
    }

    this.searchLoading = true;
    this.searchDone = false;

    // Debounce - wait 300ms before making API call
    this.searchTimeout = setTimeout(() => {
      const searchUrl = `${environment.apiUrl}/students/search?q=${encodeURIComponent(this.studentSearch)}`;

      this.http.get<any>(searchUrl)
        .subscribe({
          next: (response) => {
            this.searchLoading = false;
            this.searchDone = true;
            if (response && response.success && Array.isArray(response.data.students)) {
              this.searchResults = response.data.students;
            } else {
              this.searchResults = [];
            }
          },
          error: (err) => {
            // Search error
            this.searchLoading = false;
            this.searchDone = true;
            this.searchResults = [];
          }
        });
    }, 300);
  }

  selectStudent(student: any): void {
    this.selectedStudent = this.normalizeStudentData(student);
    this.studentSearch = '';
    this.searchResults = [];
  }

  private normalizeStudentData(student: any): any {
    if (!student) {
      return student;
    }

    const emergencyContactObj = typeof student.emergency_contact === 'object' && student.emergency_contact !== null
      ? student.emergency_contact
      : null;

    const parentPhone = student.parentPhone
      || student.parent_phone
      || student.parentPhoneNumber
      || null;

    return {
      ...student,
      parentPhone,
      emergency_contact: emergencyContactObj || {
        name: student.emergency_contact || student.emergency_contact_name || '',
        phone: student.emergency_contact_phone || parentPhone || ''
      }
    };
  }

  clearStudent(): void {
    this.selectedStudent = null;
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().substring(0, 2);
  }

  private formatVisitDateTime(value: string): string {
    if (!value || !value.trim()) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
    }

    return value.includes('T') ? `${value.replace('T', ' ')}:00` : value;
  }

  onSubmit(): void {
    if (!this.selectedStudent) {
      alert('Please select a student');
      return;
    }

    if (!this.visit.visitType || !this.visit.diagnosis) {
      alert('Please fill in required fields (Visit Type and Diagnosis)');
      return;
    }

    const currentUser = this.authService.currentUserValue;
    const clinicStaffId = currentUser?.staff_info?.clinic_staff_id;
    if (!clinicStaffId) {
      alert('Clinic staff profile not found. Please login again.');
      return;
    }

    this.loading = true;

    const visitType = this.visit.visitType === 'emergency' ? 'Emergency' : 'Routine';
    const status = this.visit.status === 'completed'
      ? 'Closed'
      : this.visit.status === 'referred'
        ? 'Referred'
        : 'Open';

    const vitals: any[] = [];
    if (this.visit.vitals.temperature !== null && this.visit.vitals.temperature !== undefined && this.visit.vitals.temperature !== ('' as any)) {
      vitals.push({
        vital_type: 'temperature',
        value: String(this.visit.vitals.temperature),
        unit: '°C'
      });
    }
    if (this.visit.vitals.bloodPressure && this.visit.vitals.bloodPressure.trim() !== '') {
      vitals.push({
        vital_type: 'blood_pressure',
        value: this.visit.vitals.bloodPressure.trim(),
        unit: 'mmHg'
      });
    }
    if (this.visit.vitals.pulseRate !== null && this.visit.vitals.pulseRate !== undefined && this.visit.vitals.pulseRate !== ('' as any)) {
      vitals.push({
        vital_type: 'heart_rate',
        value: String(this.visit.vitals.pulseRate),
        unit: 'bpm'
      });
    }

    const visitData = {
      student_id: this.selectedStudent.student_id,
      clinic_staff_id: clinicStaffId,
      visit_datetime: this.formatVisitDateTime(this.visit.dateTime),
      visit_type: visitType,
      chief_complaint: this.visit.diagnosis,
      notes: '',
      vitals,
      status,
      notify_parent: this.visit.notifyParent,
      notification_method: this.visit.notifyParent ? 'sms' : 'none'
    };

    this.http.post<any>(`${environment.apiUrl}/medical-visits`, visitData)
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            alert('Medical visit saved successfully!');
            if (this.visitSaved.observed) {
              this.visitSaved.emit();
            } else {
              this.router.navigate(['/dashboard/staff/visits']);
            }
          } else {
            alert('Failed to save visit: ' + response.message);
          }
        },
        error: (err) => {
          this.loading = false;
          // Error saving visit
          const apiMessage = err?.error?.message || err?.error?.error || null;
          const validationErrors = err?.error?.errors;
          let details = '';

          if (validationErrors && typeof validationErrors === 'object') {
            const firstKey = Object.keys(validationErrors)[0];
            const firstValue = firstKey ? validationErrors[firstKey] : null;
            const firstError = Array.isArray(firstValue) ? firstValue[0] : firstValue;
            if (firstError) {
              details = ` (${firstError})`;
            }
          }

          alert(`Failed to save visit${apiMessage ? ': ' + apiMessage : ''}${details}`);
        }
      });
  }
}
