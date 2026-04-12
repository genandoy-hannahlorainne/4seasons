import { Component, OnInit, OnDestroy } from '@angular/core';
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
    <div class="visit-form-page">
      <div class="page-header">
        <button class="back-btn" routerLink="/dashboard/staff/visits">← Back to Visits</button>
        <h1>{{ isEditMode ? 'Edit Visit' : 'New Medical Visit' }}</h1>
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
          <h3>Student Information</h3>

          <!-- Scan QR Button -->
          <div class="scan-section" *ngIf="!selectedStudent">
            <button type="button" class="btn btn-scan" (click)="openScanner()">
              Scan Student QR Code
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
            <img [src]="selectedStudent.avatar" alt="Student" class="student-avatar">
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

        <!-- Visit Details -->
        <div class="form-section">
          <h3>Visit Details</h3>
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

        <!-- Vitals -->
        <div class="form-section">
          <h3>Vital Signs</h3>
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

        <!-- Assessment & Treatment -->
        <div class="form-section">
          <h3>Assessment & Treatment</h3>
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

        <!-- Status & Notification -->
        <div class="form-section">
          <h3>Status & Notification</h3>
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

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" routerLink="/dashboard/staff/visits">Cancel</button>
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
      background: #f5f7fa;
      min-height: 100vh;
    }

    .page-header {
      margin-bottom: 1.5rem;
      .back-btn {
        background: none;
        border: none;
        color: #007bff;
        cursor: pointer;
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
        padding: 0;
        &:hover { text-decoration: underline; }
      }
      h1 { font-size: 1.8rem; color: #2c3e50; font-weight: 600; }
    }

    .visit-form { max-width: 800px; }

    .form-section {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);

      h3 { color: #2c3e50; margin: 0 0 1rem; font-size: 1.1rem; }
    }

    .scan-section {
      text-align: center;
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 1rem;

      .btn-scan {
        padding: 1rem 2rem;
        font-size: 1.1rem;
        background: #28a745;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        &:hover { background: #1e7e34; }
      }

      .or-divider {
        display: block;
        margin-top: 1rem;
        color: #7f8c8d;
        font-size: 0.9rem;
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

      label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #2c3e50; }

      .form-control {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        font-size: 1rem;
        box-sizing: border-box;
        &:focus { outline: none; border-color: #007bff; }
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
      padding: 1rem;
      background: #e3f2fd;
      border-radius: 8px;
      border: 2px solid #007bff;

      .student-avatar { width: 60px; height: 60px; border-radius: 50%; }
      .student-info { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
      .student-name { font-weight: 600; color: #2c3e50; font-size: 1.1rem; }
      .student-details { font-size: 0.9rem; color: #7f8c8d; }

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
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;

      &.btn-primary { background: #007bff; color: white; &:hover { background: #0056b3; } }
      &.btn-secondary { background: #6c757d; color: white; &:hover { background: #545b62; } }
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
      .form-row { grid-template-columns: 1fr; }
      .form-row.vitals-row { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class VisitFormComponent implements OnInit, OnDestroy {
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

    // Check if studentId is passed via query params
    const studentId = this.route.snapshot.queryParamMap.get('studentId');
    if (studentId) {
      this.loadStudentById(parseInt(studentId));
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
    console.log('QR Data received:', qrData);
    this.closeScanner();

    // Extract student_id from QR data
    if (qrData && qrData.student_id) {
      this.loadStudentById(qrData.student_id);
    } else if (qrData && qrData.student_number) {
      this.loadStudentByNumber(qrData.student_number);
    } else {
      console.error('Invalid QR data - no student_id or student_number found');
    }
  }

  loadStudentById(studentId: number): void {
    this.loading = true;
    this.http.get(`${environment.apiUrl}/students/qr/lookup?student_id=${studentId}`)
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data.student) {
            this.selectedStudent = this.normalizeStudentData(response.data.student);
            console.log('Student loaded with clearance:', this.selectedStudent);
          } else {
            console.error('Failed to load student:', response.message);
            alert('Student not found');
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading student:', error);
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
            console.log('Student loaded with clearance:', this.selectedStudent);
          } else {
            console.error('Failed to load student:', response.message);
            alert('Student not found');
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading student:', error);
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
            console.error('Search error:', err);
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
            this.router.navigate(['/dashboard/staff/visits']);
          } else {
            alert('Failed to save visit: ' + response.message);
          }
        },
        error: (err) => {
          this.loading = false;
          console.error('Error saving visit:', err);
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
