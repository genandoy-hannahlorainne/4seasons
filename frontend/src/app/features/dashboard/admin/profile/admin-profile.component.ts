import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

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
              <img [src]="profileData.avatar" [alt]="profileData.fullName" class="avatar-img">
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
                  <img src="assets/edit-icon.png" alt="" class="edit-btn-icon">
                  <span>Edit</span>
                </button>
                <button *ngIf="editMode" type="button" class="btn btn-secondary" (click)="cancelEdit()">Cancel</button>
              </div>
            </div>

            <div class="field">
              <label for="email">Email Address</label>
              <div class="input-with-icon">
                <span class="input-icon" aria-hidden="true">
                  <img src="assets/message-icon.png" alt="" class="input-icon-img">
                </span>
                <input type="email" id="email" [(ngModel)]="profileData.email" class="form-control" [disabled]="!editMode">
              </div>
            </div>

            <div class="field">
              <label for="phone">Phone Number</label>
              <div class="input-with-icon">
                <span class="input-icon" aria-hidden="true">
                  <img src="assets/contact-icon.png" alt="" class="input-icon-img">
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
        </div>
        <div class="form-group">
          <label>Confirm Password *</label>
          <input type="password" [(ngModel)]="passwordForm.confirmPassword" class="form-control" placeholder="Re-enter new password">
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
    avatar: 'assets/user-male.png'
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfileData();
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
    console.log('Saving profile:', this.profileData);
    this.editMode = false;
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
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    console.log('Changing password');
    this.closePasswordModal();
  }

  logout(): void {
    this.showLogoutModal = true;
    setTimeout(() => {
      this.authService.logout();
      this.router.navigate(['/login']);
    }, 1500);
  }
}
