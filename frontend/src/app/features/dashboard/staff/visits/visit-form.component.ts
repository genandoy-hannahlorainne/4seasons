import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { QrScannerComponent } from './qr-scanner.component';

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
              <div class="student-allergies" *ngIf="selectedStudent.allergies && selectedStudent.allergies.length > 0">
                <span class="allergy-label">⚠️ Allergies:</span>
                <span class="allergy-tags">
                  <span *ngFor="let allergy of selectedStudent.allergies" class="allergy-tag">{{ allergy }}</span>
                </span>
              </div>
            </div>
            <button type="button" class="btn-clear" (click)="clearStudent()">×</button>
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
export class VisitFormComponent implements OnInit {
  isEditMode = false;
  loading = false;
  showScanner = false;
  studentSearch = '';
  searchResults: any[] = [];
  selectedStudent: any = null;
  searchLoading = false;
  searchDone = false;
  private searchTimeout: any = null;

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
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const visitId = this.route.snapshot.paramMap.get('id');
    if (visitId && visitId !== 'new') {
      this.isEditMode = true;
      // Load visit data
    }

    // Set default datetime to now
    const now = new Date();
    this.visit.dateTime = now.toISOString().slice(0, 16);

    // Check if studentId is passed via query params
    const studentId = this.route.snapshot.queryParamMap.get('studentId');
    if (studentId) {
      this.loadStudentById(parseInt(studentId));
    }
  }

  openScanner(): void {
    this.showScanner = true;
  }

  closeScanner(): void {
    this.showScanner = false;
  }

  onQrScanned(qrData: any): void {
    console.log('QR Data received:', qrData);
    this.closeScanner();
    
    // Fetch student info using the QR data
    if (qrData.student_id) {
      this.loadStudentById(qrData.student_id);
    } else if (qrData.student_number) {
      this.loadStudentByNumber(qrData.student_number);
    }
  }

  loadStudentById(studentId: number): void {
    this.http.get<any>(`${environment.apiUrl}/get-student-by-qr.php?student_id=${studentId}`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.selectedStudent = response.student;
          } else {
            alert('Student not found');
          }
        },
        error: (err) => {
          console.error('Error loading student:', err);
          alert('Failed to load student information');
        }
      });
  }

  loadStudentByNumber(studentNumber: string): void {
    this.http.get<any>(`${environment.apiUrl}/get-student-by-qr.php?student_number=${studentNumber}`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.selectedStudent = response.student;
          } else {
            alert('Student not found');
          }
        },
        error: (err) => {
          console.error('Error loading student:', err);
          alert('Failed to load student information');
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
      const searchUrl = `${environment.apiUrl}/search-students.php?q=${encodeURIComponent(this.studentSearch)}`;
      console.log('Searching:', searchUrl);
      
      this.http.get<any>(searchUrl)
        .subscribe({
          next: (response) => {
            console.log('Search response:', response);
            this.searchLoading = false;
            this.searchDone = true;
            if (response && response.success && Array.isArray(response.students)) {
              this.searchResults = response.students;
              console.log('Found students:', this.searchResults.length);
            } else {
              this.searchResults = [];
              console.log('No students in response');
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
    this.selectedStudent = student;
    this.studentSearch = '';
    this.searchResults = [];
  }

  clearStudent(): void {
    this.selectedStudent = null;
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

    this.loading = true;
    
    const visitData = {
      student_id: this.selectedStudent.student_id,
      date_time: this.visit.dateTime,
      visit_type: this.visit.visitType,
      chief_complaint: this.visit.diagnosis,
      diagnosis: this.visit.diagnosis,
      vitals: {
        temperature: this.visit.vitals.temperature,
        blood_pressure: this.visit.vitals.bloodPressure,
        pulse_rate: this.visit.vitals.pulseRate
      },
      status: this.visit.status,
      notify_parent: this.visit.notifyParent,
      parent_phone: this.selectedStudent?.parentPhone || null
    };

    this.http.post<any>(`${environment.apiUrl}/save-medical-visit.php`, visitData)
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
          alert('Failed to save visit. Please try again.');
        }
      });
  }
}
