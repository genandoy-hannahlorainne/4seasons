import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AdminService } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./admin-profile.component.scss'],
  template: `
    <div class="admin-profile">
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
                <div class="profile-label">Role</div>
                <div class="profile-value">{{ profileData.role }}</div>
              </div>

              <div class="profile-item">
                <div class="profile-label">Username</div>
                <div class="profile-value">{{ profileData.username }}</div>
              </div>
            </div>
          </div>

          <div class="profile-settings-actions">

          </div>
        </div>

        <div class="profile-bottom-grid">
          <div class="contact-card card">
            <div class="contact-header">
              <div class="card-title">Contact Information</div>
              <div class="contact-actions">
                <button *ngIf="!editMode" type="button" class="btn btn-outline edit-btn" (click)="enableEdit()">
                  <i class="bi bi-pencil-fill edit-btn-icon"></i>
                  <span>Edit</span>
                </button>
                <button *ngIf="editMode" type="button" class="btn btn-secondary" (click)="cancelEdit()">Cancel</button>
              </div>
            </div>

            <div class="field">
              <label for="email">Email Address</label>
              <div class="input-with-icon">
                <span class="input-icon" aria-hidden="true">
                  <i class="bi bi-envelope-fill input-icon-img"></i>
                </span>
                <input type="email" id="email" [(ngModel)]="profileData.email" class="form-control" [disabled]="!editMode">
              </div>
            </div>

            <div class="field">
              <label for="phone">Phone Number</label>
              <div class="input-with-icon">
                <span class="input-icon" aria-hidden="true">
                  <i class="bi bi-telephone-fill input-icon-img"></i>
                </span>
                <input type="tel" id="phone" [(ngModel)]="profileData.phone" class="form-control" [disabled]="!editMode">
              </div>
            </div>

            <button type="button" class="btn btn-primary save-btn" (click)="saveProfile()" [disabled]="!editMode">Save Changes</button>
          </div>

          <div class="others-card card">
            <div class="card-title">Others</div>
            <button type="button" class="other-link" (click)="changePassword()">Change Password</button>
            <button type="button" class="other-link" (click)="enableEdit()">Update Information</button>
            <div class="others-sep"></div>
            <button type="button" class="other-link danger" (click)="logout()">Logout</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Change Password Modal -->
    <div class="modal-overlay" *ngIf="showPasswordModal" (click)="closePasswordModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <button class="close-btn" (click)="closePasswordModal()">×</button>
        <h3>Change Password</h3>

        <div class="form-group">
          <label>Current Password *</label>
          <input type="password" [(ngModel)]="passwordForm.currentPassword" class="form-control" placeholder="Enter current password">
        </div>
        <div class="form-group">
          <label>New Password *</label>
          <input type="password" [(ngModel)]="passwordForm.newPassword" class="form-control" placeholder="Min 6 characters">
          <small *ngIf="passwordForm.newPassword && passwordForm.newPassword.length < 6" class="error-text">Password must be at least 6 characters</small>
        </div>
        <div class="form-group">
          <label>Confirm Password *</label>
          <input type="password" [(ngModel)]="passwordForm.confirmPassword" class="form-control" placeholder="Re-enter new password">
          <small *ngIf="passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword" class="error-text">Passwords do not match</small>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" (click)="closePasswordModal()">Cancel</button>
          <button class="btn btn-primary" (click)="submitPasswordChange()">Change Password</button>
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
export class AdminProfileComponent implements OnInit {
  editMode = false;
  showPasswordModal = false;
  showLogoutModal = false;
  originalProfileData: any = {};

  profileData = {
    fullName: '',
    email: '',
    phone: '',
    role: 'System Administrator',
    username: '',
    avatar: ''
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
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
      this.profileData.fullName = currentUser.full_name || 'Administrator';
      this.profileData.email = currentUser.email || '';
      this.profileData.phone = currentUser.phone || '';
      this.profileData.username = currentUser.username || '';
    }
  }

  enableEdit(): void {
    this.editMode = true;
    this.originalProfileData = { ...this.profileData };
  }

  saveProfile(): void {
    if (!this.profileData.fullName || !this.profileData.email) {
      alert('Full name and email are required');
      return;
    }

    const updates = {
      full_name: this.profileData.fullName,
      email: this.profileData.email,
      phone: this.profileData.phone || null
    };

    this.adminService.updateProfile(updates).subscribe({
      next: (response) => {
        if (response.success) {
          // Update local storage with new user data
          const currentUser = this.authService.currentUserValue;
          if (currentUser) {
            const updatedUser = {
              ...currentUser,
              full_name: updates.full_name,
              email: updates.email,
              phone: updates.phone || undefined
            };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            this.authService.updateCurrentUser(updatedUser);
          }

          alert('Profile updated successfully');
          this.editMode = false;
        } else {
          alert(response.message || 'Failed to update profile');
        }
      },
      error: (err) => {
        // Profile update error
        const errorMessage = err.error?.message || err.message || 'Error updating profile';
        alert(errorMessage);
      }
    });
  }

  cancelEdit(): void {
    this.profileData = { ...this.originalProfileData };
    this.editMode = false;
  }

  changePassword(): void {
    this.showPasswordModal = true;
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
  }

  submitPasswordChange(): void {
    if (!this.passwordForm.currentPassword || !this.passwordForm.newPassword || !this.passwordForm.confirmPassword) {
      alert('All fields are required');
      return;
    }

    if (this.passwordForm.newPassword.length < 6) {
      alert('New password must be at least 6 characters');
      return;
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      alert('User not found');
      return;
    }

    this.adminService.changePassword(
      currentUser.user_id,
      this.passwordForm.currentPassword,
      this.passwordForm.newPassword
    ).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Password changed successfully');
          this.closePasswordModal();
        } else {
          alert(response.message || 'Failed to change password');
        }
      },
      error: (err) => {
        // Password change error
        const errorMessage = err.error?.message || err.message || 'Error changing password';
        alert(errorMessage);
      }
    });
  }

  logout(): void {
    this.showLogoutModal = true;
    this.authService.logout().subscribe({
      complete: () => window.location.replace('/login'),
      error: () => window.location.replace('/login'),
    });
  }
}
