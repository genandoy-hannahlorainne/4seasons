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

        <!-- Identity Card -->
        <div class="identity-card card">
          <div class="identity-avatar">
            <img [src]="profileData.avatar" [alt]="profileData.fullName" class="avatar-img">
          </div>
          <div class="identity-info">
            <div class="identity-name">{{ profileData.fullName }}</div>
            <div class="identity-meta">{{ profileData.advisoryClass || 'Advisory Class not assigned' }}</div>
            <div class="identity-email">{{ profileData.email }}</div>
          </div>
        </div>

        <div class="two-col">

          <!-- Contact Information (read-only display) -->
          <div class="card contact-card">
            <div class="card-head">
              <span class="card-title">Contact Information</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email</span>
              <span class="info-value">{{ profileData.email || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Phone</span>
              <span class="info-value">{{ profileData.phone || 'Not set' }}</span>
            </div>
          </div>

          <!-- Account Actions -->
          <div class="card actions-card">
            <span class="card-title">Account</span>

            <button type="button" class="action-item" (click)="changePassword()">
              <span class="action-icon"><i class="fa-solid fa-lock"></i></span>
              <div class="action-text">
                <span class="action-label">Change Password</span>
                <span class="action-sub">Update your login password</span>
              </div>
              <i class="fa-solid fa-chevron-right action-arrow"></i>
            </button>

            <button type="button" class="action-item" (click)="openEditModal()">
              <span class="action-icon"><i class="fa-solid fa-user-pen"></i></span>
              <div class="action-text">
                <span class="action-label">Update Information</span>
                <span class="action-sub">Edit your contact details</span>
              </div>
              <i class="fa-solid fa-chevron-right action-arrow"></i>
            </button>
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
        <p class="modal-sub">Edit your contact details below</p>

        <div class="form-group">
          <label>Email Address *</label>
          <input type="email" [(ngModel)]="editForm.email" class="form-control" placeholder="Enter email address">
        </div>
        <div class="form-group">
          <label>Phone Number</label>
          <input type="tel" [(ngModel)]="editForm.phone" class="form-control" placeholder="Enter phone number">
        </div>

        <div class="modal-error" *ngIf="editError">{{ editError }}</div>

        <div class="modal-actions">
          <button class="btn btn-secondary" (click)="closeEditModal()" [disabled]="saving">Cancel</button>
          <button class="btn btn-primary" (click)="saveProfile()" [disabled]="saving">
            <i class="fa-solid fa-spinner fa-spin" *ngIf="saving"></i>
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Change Password Modal -->
    <div class="modal-overlay" *ngIf="showPasswordModal" (click)="closePasswordModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <button class="close-btn" (click)="closePasswordModal()">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <h3>Change Password</h3>
        <p class="modal-sub">Choose a strong password for your account</p>

        <div class="form-group">
          <label>Current Password *</label>
          <input type="password" [(ngModel)]="passwordForm.currentPassword" class="form-control" placeholder="Enter current password">
        </div>
        <div class="form-group">
          <label>New Password *</label>
          <input type="password" [(ngModel)]="passwordForm.newPassword" class="form-control" placeholder="Min 6 characters">
        </div>
        <div class="form-group">
          <label>Confirm Password *</label>
          <input type="password" [(ngModel)]="passwordForm.confirmPassword" class="form-control" placeholder="Re-enter new password">
        </div>

        <div class="modal-error" *ngIf="passwordError">{{ passwordError }}</div>

        <div class="modal-actions">
          <button class="btn btn-secondary" (click)="closePasswordModal()">Cancel</button>
          <button class="btn btn-primary" (click)="submitPasswordChange()">Change Password</button>
        </div>
      </div>
    </div>
  `,
})
export class AdviserProfileComponent implements OnInit {
  editMode = false;
  showEditModal = false;
  showPasswordModal = false;
  showLogoutModal = false;
  saving = false;
  passwordLoading = false;
  passwordError = '';
  passwordSuccess = '';
  editError = '';
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  profileData = {
    fullName: '',
    email: '',
    phone: '',
    advisoryClass: '',
    avatar: 'assets/user-female.png'
  };

  editForm = { email: '', phone: '' };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

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

      this.adviserService.getAdviserProfile().subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            const profile = response.data;
            this.profileData.advisoryClass = profile.advisory_class || 'Not assigned';
            this.profileData.fullName = profile.full_name || this.profileData.fullName;
            this.profileData.email = profile.email || this.profileData.email;
            this.profileData.phone = profile.phone || this.profileData.phone;
          }
        },
        error: () => { this.profileData.advisoryClass = 'Not assigned'; }
      });
    }
  }

  openEditModal(): void {
    this.editForm = { email: this.profileData.email, phone: this.profileData.phone };
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
      phone: this.editForm.phone || null
    };

    this.adviserService.updateAdviserProfile(currentUser.user_id, updates).subscribe({
      next: (response) => {
        this.saving = false;
        if (response.success) {
          this.profileData.email = this.editForm.email;
          this.profileData.phone = this.editForm.phone;
          this.closeEditModal();
          this.showToast('Profile updated successfully', 'success');
          this.authService.updateCurrentUser({
            ...currentUser,
            full_name: updates.full_name,
            email: updates.email,
            phone: updates.phone || undefined
          });
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

  changePassword(): void {
    this.passwordError = '';
    this.showPasswordModal = true;
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
    this.passwordError = '';
  }

  submitPasswordChange(): void {
    if (!this.passwordForm.currentPassword || !this.passwordForm.newPassword) {
      this.passwordError = 'All fields are required.';
      return;
    }
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.passwordError = 'Passwords do not match.';
      return;
    }
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return;

    this.authService.changePassword(currentUser.user_id, this.passwordForm.currentPassword, this.passwordForm.newPassword).subscribe({
      next: () => {
        this.closePasswordModal();
        this.showToast('Password changed successfully', 'success');
      },
      error: (err) => {
        this.passwordError = err.error?.message || 'Failed to change password.';
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
