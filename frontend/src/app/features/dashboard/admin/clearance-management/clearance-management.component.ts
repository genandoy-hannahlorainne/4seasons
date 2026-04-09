import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-clearance-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="clearance-management">
      <div class="page-header">
        <h1>Medical Clearance Management</h1>
        <p>Manage student medical clearances for off-campus activities</p>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-group">
          <label>Status:</label>
          <select [(ngModel)]="filters.status" (ngModelChange)="loadClearances()">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Type:</label>
          <select [(ngModel)]="filters.type" (ngModelChange)="loadClearances()">
            <option value="all">All</option>
            <option value="off_campus">Off-Campus</option>
            <option value="sports">Sports</option>
            <option value="field_trip">Field Trip</option>
            <option value="swimming">Swimming</option>
          </select>
        </div>
        <button class="btn btn-primary" (click)="showCreateModal = true">
          + New Clearance
        </button>
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading clearances...</p>
      </div>

      <!-- Clearances List -->
      <div class="clearances-list" *ngIf="!loading">
        <div class="clearance-card" *ngFor="let clearance of clearances" 
             [class]="'status-' + clearance.status">
          <div class="card-header">
            <div class="student-info">
              <h3>{{ clearance.student.name }}</h3>
              <span class="student-details">{{ clearance.student.student_number }} | {{ clearance.student.grade_section }}</span>
            </div>
            <div class="status-badge" [class]="'badge-' + clearance.status">
              {{ clearance.status | titlecase }}
            </div>
          </div>
          
          <div class="card-body">
            <div class="clearance-details">
              <div class="detail-item">
                <label>Type:</label>
                <span>{{ clearance.clearance_type | titlecase }}</span>
              </div>
              <div class="detail-item" *ngIf="clearance.required_for">
                <label>Required For:</label>
                <span>{{ clearance.required_for }}</span>
              </div>
              <div class="detail-item" *ngIf="clearance.issued_date">
                <label>Issued:</label>
                <span>{{ clearance.issued_date | date:'mediumDate' }}</span>
              </div>
              <div class="detail-item" *ngIf="clearance.expiry_date">
                <label>Expires:</label>
                <span>{{ clearance.expiry_date | date:'mediumDate' }}</span>
                <span class="expiry-warning" *ngIf="clearance.days_until_expiry !== null && clearance.days_until_expiry < 30">
                  ({{ clearance.days_until_expiry }} days)
                </span>
              </div>
            </div>
            
            <div class="consent-status">
              <div class="consent-item">
                <span class="consent-label">Parent Consent:</span>
                <span class="consent-value" [class]="clearance.parent_consent ? 'approved' : 'pending'">
                  {{ clearance.parent_consent ? '✓ Yes' : '✗ No' }}
                </span>
              </div>
              <div class="consent-item">
                <span class="consent-label">Doctor Approval:</span>
                <span class="consent-value" [class]="clearance.doctor_approval ? 'approved' : 'pending'">
                  {{ clearance.doctor_approval ? '✓ Yes' : '✗ No' }}
                </span>
              </div>
            </div>
            
            <div class="medical-notes" *ngIf="clearance.medical_notes">
              <label>Medical Notes:</label>
              <p>{{ clearance.medical_notes }}</p>
            </div>
          </div>
          
          <div class="card-actions">
            <button class="btn btn-sm btn-secondary" (click)="editClearance(clearance)">
              Edit
            </button>
            <button class="btn btn-sm btn-success" 
                    *ngIf="clearance.status === 'pending'"
                    (click)="approveClearance(clearance)">
              Approve
            </button>
            <button class="btn btn-sm btn-danger" 
                    *ngIf="clearance.status === 'pending'"
                    (click)="denyClearance(clearance)">
              Deny
            </button>
            <button class="btn btn-sm btn-info" (click)="contactParent(clearance)">
              Contact Parent
            </button>
          </div>
        </div>
        
        <div class="empty-state" *ngIf="clearances.length === 0">
          <div class="empty-icon">📋</div>
          <h3>No clearances found</h3>
          <p>No medical clearances match your current filters.</p>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div class="modal-overlay" *ngIf="showCreateModal || editingClearance" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingClearance ? 'Edit' : 'Create' }} Medical Clearance</h2>
            <button class="close-btn" (click)="closeModal()">×</button>
          </div>
          <div class="modal-body">
            <form (ngSubmit)="saveClearance()">
              <div class="form-group">
                <label>Student ID *</label>
                <input type="number" [(ngModel)]="clearanceForm.student_id" name="student_id" required>
              </div>
              <div class="form-group">
                <label>Clearance Type *</label>
                <select [(ngModel)]="clearanceForm.clearance_type" name="clearance_type" required>
                  <option value="off_campus">Off-Campus Activities</option>
                  <option value="sports">Sports</option>
                  <option value="field_trip">Field Trip</option>
                  <option value="swimming">Swimming</option>
                </select>
              </div>
              <div class="form-group">
                <label>Status *</label>
                <select [(ngModel)]="clearanceForm.status" name="status" required>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="denied">Denied</option>
                </select>
              </div>
              <div class="form-group">
                <label>Required For</label>
                <input type="text" [(ngModel)]="clearanceForm.required_for" name="required_for" 
                       placeholder="e.g., Heart condition monitoring">
              </div>
              <div class="form-group">
                <label>Expiry Date</label>
                <input type="date" [(ngModel)]="clearanceForm.expiry_date" name="expiry_date">
              </div>
              <div class="form-group">
                <label>Doctor Name</label>
                <input type="text" [(ngModel)]="clearanceForm.doctor_name" name="doctor_name">
              </div>
              <div class="form-group">
                <label>Medical Notes</label>
                <textarea [(ngModel)]="clearanceForm.medical_notes" name="medical_notes" rows="3"></textarea>
              </div>
              <div class="checkbox-group">
                <label>
                  <input type="checkbox" [(ngModel)]="clearanceForm.parent_consent" name="parent_consent">
                  Parent Consent Obtained
                </label>
                <label>
                  <input type="checkbox" [(ngModel)]="clearanceForm.doctor_approval" name="doctor_approval">
                  Doctor Approval Obtained
                </label>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving">
                  {{ saving ? 'Saving...' : 'Save' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .clearance-management {
      padding: 2rem;
      background: #f5f7fa;
      min-height: 100vh;
    }

    .page-header {
      margin-bottom: 2rem;
      h1 { color: #2c3e50; margin-bottom: 0.5rem; }
      p { color: #7f8c8d; }
    }

    .filters-section {
      display: flex;
      gap: 1rem;
      align-items: end;
      margin-bottom: 2rem;
      padding: 1rem;
      background: white;
      border-radius: 8px;

      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        
        label { font-weight: 500; color: #2c3e50; }
        select { padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
      }
    }

    .clearances-list {
      display: grid;
      gap: 1rem;
    }

    .clearance-card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border-left: 4px solid #ddd;

      &.status-pending { border-left-color: #ffc107; }
      &.status-approved { border-left-color: #28a745; }
      &.status-denied { border-left-color: #dc3545; }
      &.status-expired { border-left-color: #6c757d; }
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 1rem;

      .student-info h3 { margin: 0; color: #2c3e50; }
      .student-details { color: #7f8c8d; font-size: 0.9rem; }
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;

      &.badge-pending { background: #fff3cd; color: #856404; }
      &.badge-approved { background: #d4edda; color: #155724; }
      &.badge-denied { background: #f8d7da; color: #721c24; }
      &.badge-expired { background: #e2e3e5; color: #383d41; }
    }

    .clearance-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0.5rem;
      margin-bottom: 1rem;

      .detail-item {
        display: flex;
        gap: 0.5rem;
        label { font-weight: 500; color: #495057; }
        span { color: #2c3e50; }
        .expiry-warning { color: #dc3545; font-weight: 500; }
      }
    }

    .consent-status {
      display: flex;
      gap: 2rem;
      margin-bottom: 1rem;

      .consent-item {
        display: flex;
        gap: 0.5rem;
        .consent-label { color: #495057; }
        .consent-value {
          font-weight: 500;
          &.approved { color: #28a745; }
          &.pending { color: #dc3545; }
        }
      }
    }

    .medical-notes {
      margin-bottom: 1rem;
      label { font-weight: 500; color: #495057; display: block; margin-bottom: 0.25rem; }
      p { color: #2c3e50; margin: 0; font-size: 0.9rem; }
    }

    .card-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 500;

      &.btn-sm { padding: 0.25rem 0.75rem; font-size: 0.8rem; }
      &.btn-primary { background: #007bff; color: white; }
      &.btn-secondary { background: #6c757d; color: white; }
      &.btn-success { background: #28a745; color: white; }
      &.btn-danger { background: #dc3545; color: white; }
      &.btn-info { background: #17a2b8; color: white; }
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #eee;

      h2 { margin: 0; }
      .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
    }

    .modal-body {
      padding: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
      label { display: block; margin-bottom: 0.25rem; font-weight: 500; }
      input, select, textarea { 
        width: 100%; 
        padding: 0.5rem; 
        border: 1px solid #ddd; 
        border-radius: 4px; 
        box-sizing: border-box;
      }
    }

    .checkbox-group {
      margin-bottom: 1rem;
      label { 
        display: flex; 
        align-items: center; 
        gap: 0.5rem; 
        margin-bottom: 0.5rem;
        font-weight: normal;
      }
    }

    .modal-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #7f8c8d;

      .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
      h3 { margin-bottom: 0.5rem; }
    }

    .loading {
      text-align: center;
      padding: 3rem;

      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #e8f0f8;
        border-top: 4px solid #052355;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class ClearanceManagementComponent implements OnInit {
  loading = false;
  saving = false;
  clearances: any[] = [];
  showCreateModal = false;
  editingClearance: any = null;

  filters = {
    status: 'all',
    type: 'all'
  };

  clearanceForm = {
    clearance_id: null,
    student_id: null,
    clearance_type: 'off_campus',
    status: 'pending',
    required_for: '',
    expiry_date: '',
    doctor_name: '',
    medical_notes: '',
    parent_consent: false,
    doctor_approval: false
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadClearances();
  }

  loadClearances(): void {
    this.loading = true;
    const params = new URLSearchParams();
    if (this.filters.status !== 'all') params.append('status', this.filters.status);
    if (this.filters.type !== 'all') params.append('type', this.filters.type);

    this.http.get(`${environment.apiUrl}/admin/manage-clearances.php?${params.toString()}`)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.clearances = response.clearances;
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading clearances:', error);
          this.loading = false;
        }
      });
  }

  editClearance(clearance: any): void {
    this.editingClearance = clearance;
    this.clearanceForm = { ...clearance };
  }

  approveClearance(clearance: any): void {
    this.updateClearanceStatus(clearance.clearance_id, 'approved');
  }

  denyClearance(clearance: any): void {
    this.updateClearanceStatus(clearance.clearance_id, 'denied');
  }

  updateClearanceStatus(clearanceId: number, status: string): void {
    const updateData = { clearance_id: clearanceId, status };
    
    this.http.put(`${environment.apiUrl}/admin/manage-clearances.php`, updateData)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.loadClearances();
          }
        },
        error: (error) => {
          console.error('Error updating clearance:', error);
        }
      });
  }

  saveClearance(): void {
    this.saving = true;
    const method = this.editingClearance ? 'PUT' : 'POST';
    
    this.http.request(method, `${environment.apiUrl}/admin/manage-clearances.php`, {
      body: this.clearanceForm
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.closeModal();
          this.loadClearances();
        }
        this.saving = false;
      },
      error: (error) => {
        console.error('Error saving clearance:', error);
        this.saving = false;
      }
    });
  }

  contactParent(clearance: any): void {
    // Implement parent contact functionality
    console.log('Contact parent for:', clearance.student.name);
  }

  closeModal(): void {
    this.showCreateModal = false;
    this.editingClearance = null;
    this.clearanceForm = {
      clearance_id: null,
      student_id: null,
      clearance_type: 'off_campus',
      status: 'pending',
      required_for: '',
      expiry_date: '',
      doctor_name: '',
      medical_notes: '',
      parent_consent: false,
      doctor_approval: false
    };
  }
}