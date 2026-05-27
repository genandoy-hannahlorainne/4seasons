import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { StaffService } from '../../../../core/services/staff.service';

@Component({
  selector: 'app-staff-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./staff-profile.component.scss', '../shared-staff-styles.scss'],
  template: `
    <div class="staff-profile">
      <div class="profile-header">
        <h1>Profile Settings</h1>
      </div>

      <div class="profile-content">
        <div class="profile-settings card" role="region" aria-label="Profile Settings">
          <div class="profile-settings-left">
            <div class="profile-avatar">
              <div class="avatar-initials">{{ getInitials(profileData.fullName) }}</div>
            </div>
          </div>

          <div class="profile-settings-main">
            <div class="profile-grid">
              <div class="profile-item">
                <div class="profile-label">Full Name</div>
                <div class="profile-value">{{ profileData.fullName }}</div>
              </div>
              <div class="profile-item">
                <div class="profile-label">Staff Code</div>
                <div class="profile-value">{{ profileData.staffCode || 'Not set' }}</div>
              </div>
              <div class="profile-item">
                <div class="profile-label">Position</div>
                <div class="profile-value">{{ profileData.position }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="profile-bottom-grid">
          <div class="contact-card card">
            <div class="contact-header">
              <div class="card-title">Contact Information</div>
              <button type="button" class="btn btn-outline edit-btn" (click)="openEditModal()">
                <i class="bi bi-pencil-fill edit-btn-icon"></i>
                <span>Edit</span>
              </button>
            </div>

            <div class="field">
              <label>Email Address</label>
              <div class="input-with-icon">
                <span class="input-icon" aria-hidden="true">
                  <i class="bi bi-envelope-fill input-icon-img"></i>
                </span>
                <input type="email" [value]="profileData.email" class="form-control" readonly placeholder="Not provided">
              </div>
            </div>

            <div class="field">
              <label>Phone Number</label>
              <div class="input-with-icon">
                <span class="input-icon" aria-hidden="true">
                  <i class="bi bi-telephone-fill input-icon-img"></i>
                </span>
                <input type="tel" [value]="profileData.phone" class="form-control" readonly placeholder="Not provided">
              </div>
            </div>
          </div>

          <div class="others-card card">
            <div class="card-title">Others</div>
            <button type="button" class="other-link" (click)="requestPasswordChange()">Request Password Reset from Admin</button>
            <button type="button" class="other-link" (click)="openEditModal()">Update Information</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Update Information Modal -->
    <div class="modal-overlay" *ngIf="showEditModal" (click)="closeEditModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <button class="close-btn" (click)="closeEditModal()"><i class="fa-solid fa-xmark"></i></button>
        <h3>Update Information</h3>

        <div class="modal-error" *ngIf="editError">{{ editError }}</div>

        <div class="form-group">
          <label>Staff Code</label>
          <input type="text" [(ngModel)]="editForm.staffCode" class="form-control" placeholder="Enter staff code">
        </div>
        <div class="form-group">
          <label>Email Address *</label>
          <input type="email" [(ngModel)]="editForm.email" class="form-control" placeholder="Enter email address">
        </div>
        <div class="form-group">
          <label>Phone Number</label>
          <input type="tel" [(ngModel)]="editForm.phone" class="form-control" placeholder="Enter phone number">
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" (click)="closeEditModal()" [disabled]="saving">Cancel</button>
          <button class="btn btn-primary" (click)="saveProfile()" [disabled]="saving">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Request Password Reset Modal -->
    <div class="modal-overlay" *ngIf="showRequestPasswordModal" (click)="closeRequestPasswordModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <button class="close-btn" (click)="closeRequestPasswordModal()"><i class="fa-solid fa-xmark"></i></button>
        <h3>Request Password Change</h3>
        <p class="modal-desc">Submit your desired new password. Admin will review and approve your request.</p>

        <div class="modal-error" *ngIf="requestPasswordError">{{ requestPasswordError }}</div>

        <div class="form-group">
          <label>New Password *</label>
          <div class="input-password-wrap">
            <input [type]="showNewPassword ? 'text' : 'password'" [(ngModel)]="passwordRequestNewPassword" class="form-control" placeholder="Enter your desired new password (min 6 characters)">
            <button type="button" class="toggle-pw-btn" (click)="showNewPassword = !showNewPassword" tabindex="-1">
              <svg *ngIf="!showNewPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg *ngIf="showNewPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </button>
          </div>
        </div>
        <div class="form-group">
          <label>Confirm New Password *</label>
          <div class="input-password-wrap">
            <input [type]="showConfirmPassword ? 'text' : 'password'" [(ngModel)]="passwordRequestConfirmPassword" class="form-control" placeholder="Re-enter your new password">
            <button type="button" class="toggle-pw-btn" (click)="showConfirmPassword = !showConfirmPassword" tabindex="-1">
              <svg *ngIf="!showConfirmPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg *ngIf="showConfirmPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </button>
          </div>
        </div>
        <div class="form-group">
          <label>Reason for Request (Optional)</label>
          <textarea [(ngModel)]="passwordRequestReason" class="form-control" rows="2" placeholder="e.g., I forgot my password, Security concern, etc."></textarea>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" (click)="closeRequestPasswordModal()" [disabled]="submittingRequest">Cancel</button>
          <button class="btn btn-primary" (click)="submitPasswordRequest()" [disabled]="submittingRequest">
            {{ submittingRequest ? 'Submitting...' : 'Submit Request' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Logout Modal -->
    <div class="modal-overlay" *ngIf="showLogoutModal">
      <div class="modal-content logout-modal">
        <div class="spinner"></div>
        <p>Logging out...</p>
      </div>
    </div>
  `,
})
export class StaffProfileComponent implements OnInit {
  editMode = false;
  showEditModal = false;
  showRequestPasswordModal = false;
  showLogoutModal = false;
  submittingRequest = false;
  saving = false;
  editError = '';
  originalProfileData: any = {};

  profileData = {
    fullName: '',
    email: '',
    phone: '',
    position: 'Clinic Staff',
    staffCode: '',
    avatar: ''
  };

  editForm = { email: '', phone: '', staffCode: '' };

  passwordRequestReason = '';
  passwordRequestNewPassword = '';
  passwordRequestConfirmPassword = '';
  requestPasswordError = '';
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private authService: AuthService,
    private staffService: StaffService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfileData();
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').filter(n => n).map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  loadProfileData(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.profileData.fullName = currentUser.full_name || 'Clinic Staff';
      this.profileData.email = currentUser.email || '';
      this.profileData.phone = currentUser.phone || '';

      // Use staff_info from auth token immediately (no API call needed)
      const staffInfo = (currentUser as any).staff_info;
      if (staffInfo) {
        this.profileData.staffCode = staffInfo.staff_code || staffInfo.staff_id || '';
        this.profileData.position = staffInfo.position || 'Clinic Staff';
      }
    }

    // Also try the dedicated profile endpoint for fresh data
    this.staffService.getStaffProfile().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const data = response.data;
          this.profileData.fullName = data.full_name || this.profileData.fullName;
          this.profileData.email = data.email || this.profileData.email;
          this.profileData.phone = data.phone || this.profileData.phone;
          this.profileData.staffCode = data.staff_code || this.profileData.staffCode;
          this.profileData.position = data.position || this.profileData.position;
        }
      },
      error: () => {
        // Silently fall back to auth token data already loaded above
      }
    });
  }

  enableEdit(): void {
    this.openEditModal();
  }

  openEditModal(): void {
    this.editForm = {
      email: this.profileData.email,
      phone: this.profileData.phone,
      staffCode: this.profileData.staffCode
    };
    this.editError = '';
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editError = '';
  }

  saveProfile(): void {
    if (!this.editForm.email) {
      this.editError = 'Email address is required.';
      return;
    }

    const currentUser = this.authService.currentUserValue;
    if (!currentUser) { this.editError = 'User not found.'; return; }

    this.saving = true;
    this.editError = '';

    const updates = {
      email: this.editForm.email,
      phone: this.editForm.phone || null,
      staff_code: this.editForm.staffCode || null
    };

    this.staffService.updateStaffProfile(currentUser.user_id, updates).subscribe({
      next: (response) => {
        this.saving = false;
        if (response.success) {
          this.profileData.email = this.editForm.email;
          this.profileData.phone = this.editForm.phone;
          this.profileData.staffCode = this.editForm.staffCode;
          this.closeEditModal();
          this.authService.updateCurrentUser({ ...currentUser, email: updates.email, phone: updates.phone || undefined });
        } else {
          this.editError = response.message || 'Failed to update profile.';
        }
      },
      error: (err) => {
        this.saving = false;
        this.editError = err.error?.message || 'Error updating profile.';
      }
    });
  }

  cancelEdit(): void {
    this.closeEditModal();
  }

  requestPasswordChange(): void {
    this.requestPasswordError = '';
    this.passwordRequestReason = '';
    this.passwordRequestNewPassword = '';
    this.passwordRequestConfirmPassword = '';
    this.showRequestPasswordModal = true;
  }

  closeRequestPasswordModal(): void {
    this.showRequestPasswordModal = false;
    this.passwordRequestReason = '';
    this.passwordRequestNewPassword = '';
    this.passwordRequestConfirmPassword = '';
    this.requestPasswordError = '';
    this.showNewPassword = false;
    this.showConfirmPassword = false;
  }

  submitPasswordRequest(): void {
    this.submittingRequest = true;
    this.requestPasswordError = '';

    // Validation
    if (!this.passwordRequestNewPassword) {
      this.requestPasswordError = 'Please enter a new password';
      this.submittingRequest = false;
      return;
    }

    if (this.passwordRequestNewPassword.length < 6) {
      this.requestPasswordError = 'Password must be at least 6 characters';
      this.submittingRequest = false;
      return;
    }

    if (this.passwordRequestNewPassword !== this.passwordRequestConfirmPassword) {
      this.requestPasswordError = 'Passwords do not match';
      this.submittingRequest = false;
      return;
    }

    this.authService.requestPasswordChange(this.passwordRequestReason, this.passwordRequestNewPassword).subscribe({
      next: (response) => {
        this.submittingRequest = false;
        this.closeRequestPasswordModal();
        alert('Password change request submitted successfully! Admin will review your request.');
      },
      error: (err) => {
        this.submittingRequest = false;
        this.requestPasswordError = err.error?.message || 'Failed to submit request. Please try again.';
      }
    });
  }

  logout(): void {
    this.showLogoutModal = true;
    this.authService.logout().subscribe({
      complete: () => window.location.replace('/role-selection'),
      error: () => window.location.replace('/role-selection'),
    });
  }
}
