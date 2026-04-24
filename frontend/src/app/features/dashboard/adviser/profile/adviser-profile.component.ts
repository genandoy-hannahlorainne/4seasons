import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AdviserService } from '../../../../core/services/adviser.service';

@Component({
  selector: 'app-adviser-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./adviser-profile.component.scss'],
  template: `
    <div class="adviser-profile">

      <!-- Toast notification -->
      <div class="toast" *ngIf="toastMessage" [class.toast-error]="toastType === 'error'">
        <i class="fa-solid" [class.fa-circle-check]="toastType === 'success'" [class.fa-circle-exclamation]="toastType === 'error'"></i>
        {{ toastMessage }}
      </div>

      <!-- Hero Header -->
      <div class="profile-header">
        <h1>Profile Settings</h1>
        <p>Manage your account information and security</p>
      </div>

      <div class="profile-content">

        <!-- Profile Settings Card -->
        <div class="profile-settings card" role="region" aria-label="Profile Settings">
          <div class="profile-settings-left">
            <div class="profile-avatar">
              <img [src]="profileData.avatar" [alt]="profileData.fullName" class="avatar-img">
            </div>
          </div>

          <div class="profile-settings-main">
            <div class="profile-grid">
              <div class="profile-item">
                <div class="profile-label">Full Name</div>
                <div class="profile-value">{{ profileData.fullName || 'Loading...' }}</div>
              </div>

              <div class="profile-item">
                <div class="profile-label">Date of Birth</div>
                <div class="profile-value">{{ profileData.birthDate || 'Not set' }}</div>
              </div>

              <div class="profile-item">
                <div class="profile-label">Advisory Class</div>
                <div class="profile-value">{{ profileData.advisoryClass || 'Not assigned' }}</div>
              </div>

              <div class="profile-item">
                <div class="profile-label">Employee ID</div>
                <div class="profile-value">{{ profileData.employeeId || 'Not set' }}</div>
              </div>
            </div>
          </div>

          <div class="profile-settings-actions">

          </div>
        </div>

        <!-- Bottom Grid -->
        <div class="profile-bottom-grid">
          <!-- Contact Information Card -->
          <div class="contact-card card">
            <div class="contact-header">
              <div class="card-title">Contact Information</div>
              <button type="button" class="btn btn-outline edit-btn" (click)="openEditModal()">
                <img src="assets/edit-icon.png" alt="" class="edit-btn-icon">
                <span>Edit</span>
              </button>
            </div>

            <div class="field">
              <label for="email">Email Address</label>
              <div class="input-with-icon">
                <span class="input-icon" aria-hidden="true">
                  <img src="assets/message-icon.png" alt="" class="input-icon-img">
                </span>
                <input type="email" id="email" [value]="profileData.email" class="form-control" readonly placeholder="Not provided">
              </div>
            </div>

            <div class="field">
              <label for="phone">Phone Number</label>
              <div class="input-with-icon">
                <span class="input-icon" aria-hidden="true">
                  <img src="assets/contact-icon.png" alt="" class="input-icon-img">
                </span>
                <input type="tel" id="phone" [value]="profileData.phone" class="form-control" readonly placeholder="Not provided">
              </div>
            </div>
          </div>

          <!-- Account Card -->
          <div class="others-card card">
            <div class="card-title">Account</div>
            <button type="button" class="other-link" (click)="requestPasswordChange()">Request Password Reset from Admin</button>
            <button type="button" class="other-link" (click)="openEditModal()">Update Information</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Update Information Modal -->
    <div class="modal-overlay" *ngIf="showEditModal" (click)="closeEditModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <button class="close-btn" (click)="closeEditModal()">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <h3>Update Information</h3>

        <div class="modal-error" *ngIf="editError">{{ editError }}</div>

        <div class="form-group">
          <label>Employee ID</label>
          <input type="text" [(ngModel)]="editForm.employeeId" class="form-control" placeholder="Enter employee ID">
        </div>
        <div class="form-group">
          <label>Date of Birth</label>
          <input type="date" [(ngModel)]="editForm.birthDate" class="form-control">
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
        <button class="close-btn" (click)="closeRequestPasswordModal()">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <h3>Request Password Change</h3>
        <p style="color: #666; margin-bottom: 1rem;">Submit your desired new password. Admin will review and approve your request.</p>

        <div class="modal-error" *ngIf="requestPasswordError">{{ requestPasswordError }}</div>

        <div class="form-group">
          <label>New Password *</label>
          <input type="password" [(ngModel)]="passwordRequestNewPassword" class="form-control" placeholder="Enter your desired new password (min 6 characters)" required>
        </div>

        <div class="form-group">
          <label>Confirm New Password *</label>
          <input type="password" [(ngModel)]="passwordRequestConfirmPassword" class="form-control" placeholder="Re-enter your new password" required>
        </div>

        <div class="form-group">
          <label>Reason for Request (Optional)</label>
          <textarea [(ngModel)]="passwordRequestReason" class="form-control" rows="3" placeholder="e.g., I forgot my password, Security concern, etc."></textarea>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" (click)="closeRequestPasswordModal()" [disabled]="submittingRequest">Cancel</button>
          <button class="btn btn-primary" (click)="submitPasswordRequest()" [disabled]="submittingRequest">
            {{ submittingRequest ? 'Submitting...' : 'Submit Request' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class AdviserProfileComponent implements OnInit {
  editMode = false;
  showEditModal = false;
  showRequestPasswordModal = false;
  showLogoutModal = false;
  saving = false;
  submittingRequest = false;
  editError = '';
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  profileData = {
    fullName: '',
    email: '',
    phone: '',
    advisoryClass: '',
    birthDate: 'Loading...',
    employeeId: 'Loading...',
    avatar: 'assets/user-female.png'
  };

  editForm = { email: '', phone: '', employeeId: '', birthDate: '' };

  passwordRequestReason = '';
  passwordRequestNewPassword = '';
  passwordRequestConfirmPassword = '';
  requestPasswordError = '';

  constructor(
    private authService: AuthService,
    private adviserService: AdviserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfileData();
  }

  loadProfileData(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.profileData.fullName = currentUser.full_name || 'Adviser';
      this.profileData.email = currentUser.email || '';
      this.profileData.phone = currentUser.phone || '';
      // Get employee_id from adviser_info (always available from /me endpoint)
      const adviserInfo = (currentUser as any).adviser_info;
      if (adviserInfo?.employee_id) {
        this.profileData.employeeId = adviserInfo.employee_id;
      }

      this.adviserService.getAdviserProfile().subscribe({
        next: (response: any) => {
          console.log('Adviser Profile API Response:', response);
          if (response.success && response.data) {
            const profile = response.data;
            console.log('Profile Data:', profile);
            console.log('Employee ID from API:', profile.employee_id);
            console.log('Birth Date from API:', profile.birth_date);

            this.profileData.advisoryClass = profile.advisory_class || 'Not assigned';
            this.profileData.fullName = profile.full_name || this.profileData.fullName;
            this.profileData.email = profile.email || this.profileData.email;
            this.profileData.phone = profile.phone || this.profileData.phone;
            this.profileData.birthDate = profile.birth_date ? profile.birth_date : 'Not set';
            // Check employee_id directly, or from adviser_info, or fallback to employee_number
            const empId = profile.employee_id
              || profile.adviser_info?.employee_id
              || profile.employee_number
              || this.profileData.employeeId;
            this.profileData.employeeId = (empId && empId !== 'Loading...') ? empId : 'Not set';

            console.log('Profile Data After Update:', this.profileData);
          }
        },
        error: (err) => {
          console.error('Error loading adviser profile:', err);
          this.profileData.advisoryClass = 'Not assigned';
          this.profileData.birthDate = 'Not set';
          this.profileData.employeeId = 'Not set';
        }
      });
    }
  }

  openEditModal(): void {
    this.editForm = {
      email: this.profileData.email,
      phone: this.profileData.phone,
      employeeId: this.profileData.employeeId,
      birthDate: this.profileData.birthDate
    };
    this.editError = '';
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editError = '';
  }

  // kept for backward compat
  enableEdit(): void { this.openEditModal(); }
  cancelEdit(): void { this.closeEditModal(); }

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
      full_name: this.profileData.fullName,
      email: this.editForm.email,
      phone: this.editForm.phone || null,
      employee_id: this.editForm.employeeId || null,
      birth_date: this.editForm.birthDate || null
    };

    this.adviserService.updateAdviserProfile(currentUser.user_id, updates).subscribe({
      next: (response) => {
        this.saving = false;
        if (response.success) {
          this.profileData.email = this.editForm.email;
          this.profileData.phone = this.editForm.phone;
          this.profileData.employeeId = this.editForm.employeeId;
          this.profileData.birthDate = this.editForm.birthDate;
          this.closeEditModal();
          this.showToast('Profile updated successfully', 'success');

          // Update user object with only User interface fields
          this.authService.updateCurrentUser({
            ...currentUser,
            full_name: updates.full_name,
            email: updates.email,
            phone: updates.phone || undefined
          });

          // Reload profile to get updated adviser data
          this.loadProfileData();
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
        this.showToast('Password change request submitted successfully! Admin will review your request.', 'success');
      },
      error: (err) => {
        this.submittingRequest = false;
        this.requestPasswordError = err.error?.message || 'Failed to submit request. Please try again.';
      }
    });
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.toastMessage = ''; }, 3500);
  }

  logout(): void {
    this.authService.logout().subscribe({
      complete: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }
}
