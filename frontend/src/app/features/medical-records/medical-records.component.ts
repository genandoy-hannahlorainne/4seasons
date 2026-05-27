import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MedicalRecordsService, MedicalRecord } from './medical-records.service';
import { AuthService } from '../../core/services/auth.service';
import { StudentService } from '../../core/services/student.service';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-medical-records',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="medical-records-container">
      <div class="header">
        <h1>My Medical Record</h1>
        <p class="subtitle">View and manage your medical information</p>
      </div>

      <div *ngIf="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>Loading medical records...</p>
      </div>

      <div *ngIf="error" class="error-message">{{ error }}</div>

      <div *ngIf="medicalRecord && !loading" class="content">
        <div class="overview-section">
          <div class="overview-section-title">Visit Overview</div>
          <div class="overview-cards">
            <div class="overview-card">
              <div class="card-content">
                <h3>Total Visits</h3>
                <div class="card-value">{{ medicalRecord.total_visits_count }}</div>
              </div>
            </div>
            <div class="overview-card">
              <div class="card-content">
                <h3>Recent Visits</h3>
                <div class="card-value">{{ medicalRecord.recent_visits_count }}</div>
                <div class="card-subtitle">Last 30 days</div>
              </div>
            </div>
            <div class="overview-card">
              <div class="card-content">
                <h3>Adviser</h3>
                <div class="card-value adviser-value">
                  {{ medicalRecord.personal_info.adviser_name || 'Not assigned' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="action-cards">
          <div class="action-card" (click)="openPersonalInfoModal()" style="cursor:pointer">
            <div class="action-icon">
              <i class="bi bi-person-lines-fill" style="font-size:28px;color:#052355;"></i>
            </div>
            <div class="action-content">
              <h3>Personal Medical Info</h3>
              <p>View and update your personal medical information, height, weight, and emergency contact</p>
            </div>
            <div class="action-arrow">→</div>
          </div>

          <div class="action-card" routerLink="visits-history">
            <div class="action-icon">
              <i class="bi bi-clipboard2-pulse-fill" style="font-size:28px;color:#052355;"></i>
            </div>
            <div class="action-content">
              <h3>Medical Visits History</h3>
              <p>View your complete medical visits history and detailed visit information</p>
            </div>
            <div class="action-arrow">→</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Personal Medical Info Modal -->
    <div class="modal-overlay" *ngIf="showPersonalInfoModal" (click)="closePersonalInfoModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <button class="close-btn" (click)="closePersonalInfoModal()">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <h3>Personal Medical Info</h3>

        <div class="modal-error" *ngIf="modalError">{{ modalError }}</div>
        <div class="modal-success" *ngIf="modalSuccess">{{ modalSuccess }}</div>

        <div *ngIf="modalLoading" style="text-align:center;padding:2rem;">Loading...</div>

        <div *ngIf="!modalLoading">
          <div class="form-group">
            <label>Name of Parent/Guardian</label>
            <input type="text" [(ngModel)]="basicInfo.parent_guardian_name" class="form-control" placeholder="Enter parent/guardian name">
          </div>
          <div class="form-group">
            <label>Contact Person in Case of Emergency</label>
            <input type="text" [(ngModel)]="basicInfo.emergency_contact" class="form-control" placeholder="Enter emergency contact name">
          </div>
          <div class="form-group">
            <label>Relationship</label>
            <select [(ngModel)]="basicInfo.emergency_contact_relation" class="form-control">
              <option value="">Select relationship</option>
              <option value="mother">Mother</option>
              <option value="father">Father</option>
              <option value="guardian">Guardian</option>
              <option value="sibling">Sibling</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Contact Number</label>
            <input type="tel" [(ngModel)]="basicInfo.emergency_contact_phone" class="form-control" placeholder="Enter contact number">
          </div>
          <div class="form-group">
            <label>Complete Address</label>
            <textarea [(ngModel)]="basicInfo.address" class="form-control" rows="2" placeholder="Enter complete address"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Height (cm)</label>
              <input type="number" [(ngModel)]="basicInfo.height_cm" class="form-control" placeholder="e.g. 165">
            </div>
            <div class="form-group">
              <label>Weight (kg)</label>
              <input type="number" [(ngModel)]="basicInfo.weight_kg" class="form-control" placeholder="e.g. 55">
            </div>
            <div class="form-group">
              <label>Blood Type</label>
              <select [(ngModel)]="basicInfo.blood_type" class="form-control">
                <option value="">Select</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="closePersonalInfoModal()" [disabled]="saving">Cancel</button>
            <button class="btn btn-primary" (click)="savePersonalInfo()" [disabled]="saving">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./medical-records.component.scss']
})
export class MedicalRecordsComponent implements OnInit, OnDestroy {
  medicalRecord: MedicalRecord | null = null;
  loading = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();
  private refreshInterval = 30000;

  // Modal state
  showPersonalInfoModal = false;
  modalLoading = false;
  modalError = '';
  modalSuccess = '';
  saving = false;
  studentId: number | null = null;

  basicInfo = {
    parent_guardian_name: '',
    emergency_contact: '',
    emergency_contact_relation: '',
    emergency_contact_phone: '',
    address: '',
    height_cm: null as number | null,
    weight_kg: null as number | null,
    blood_type: ''
  };

  constructor(
    private medicalRecordsService: MedicalRecordsService,
    private authService: AuthService,
    private studentService: StudentService
  ) {}

  ngOnInit() {
    this.loadMedicalRecord();
    interval(this.refreshInterval)
      .pipe(switchMap(() => this.medicalRecordsService.getMedicalRecord()), takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.medicalRecord = response.data;
            this.ensureAdviserNameFallback();
          }
        },
        error: (err) => {
          // Auto-refresh error
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openPersonalInfoModal(): void {
    this.modalError = '';
    this.modalSuccess = '';
    this.modalLoading = true;
    this.showPersonalInfoModal = true;

    const currentUser = this.authService.currentUserValue;
    if (!currentUser?.user_id) { this.modalLoading = false; return; }

    this.studentService.getStudentProfile(currentUser.user_id).subscribe({
      next: (response) => {
        const profile = response.profile || response.data?.personal_info || response;
        this.studentId = profile.student_id || null;
        this.basicInfo = {
          parent_guardian_name: profile.parent_guardian_name || '',
          emergency_contact: profile.emergency_contact || '',
          emergency_contact_relation: profile.emergency_contact_relation || '',
          emergency_contact_phone: profile.emergency_contact_phone || profile.contact_number || '',
          address: profile.address || '',
          height_cm: profile.height_cm || null,
          weight_kg: profile.weight_kg || null,
          blood_type: profile.blood_type || ''
        };
        this.modalLoading = false;
      },
      error: () => {
        this.modalError = 'Failed to load profile data.';
        this.modalLoading = false;
      }
    });
  }

  closePersonalInfoModal(): void {
    this.showPersonalInfoModal = false;
    this.modalError = '';
    this.modalSuccess = '';
  }

  savePersonalInfo(): void {
    if (!this.studentId) { this.modalError = 'Student profile not loaded.'; return; }
    this.saving = true;
    this.modalError = '';

    this.studentService.updateStudentProfile(this.studentId, {
      ...this.basicInfo,
      contactNumber: this.basicInfo.emergency_contact_phone
    }).subscribe({
      next: (response) => {
        this.saving = false;
        if (response.success) {
          this.modalSuccess = 'Information updated successfully!';
          setTimeout(() => this.closePersonalInfoModal(), 1500);
          this.loadMedicalRecord();
        } else {
          this.modalError = response.message || 'Failed to update.';
        }
      },
      error: (err) => {
        this.saving = false;
        this.modalError = err.error?.message || 'Error updating information.';
      }
    });
  }

  private loadMedicalRecord() {
    this.loading = true;
    this.error = null;
    this.medicalRecordsService.getMedicalRecord().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.medicalRecord = response.data;
          this.ensureAdviserNameFallback();
        } else {
          this.error = response.message || 'Failed to load medical record';
        }
        this.loading = false;
      },
      error: (error) => {
        // Error loading medical record
        this.error = 'Failed to load medical record. Please try again.';
        this.loading = false;
      }
    });
  }

  private ensureAdviserNameFallback(): void {
    if (!this.medicalRecord?.personal_info) return;
    const hasAdviser = !!this.medicalRecord.personal_info.adviser_name;
    const currentUser = this.authService.currentUserValue;
    if (hasAdviser || !currentUser?.user_id) return;

    this.studentService.getStudentMedicalData(currentUser.user_id).subscribe({
      next: (legacyResponse) => {
        const legacyAdviser = legacyResponse?.data?.personal_info?.adviser_name;
        const legacyContact = legacyResponse?.data?.personal_info?.adviser_contact;
        if (this.medicalRecord?.personal_info && legacyAdviser) {
          this.medicalRecord.personal_info.adviser_name = legacyAdviser;
          this.medicalRecord.personal_info.adviser_contact = legacyContact || this.medicalRecord.personal_info.adviser_contact;
        }
      },
      error: (err) => {
        // Adviser fallback fetch failed
      }
    });
  }
}
