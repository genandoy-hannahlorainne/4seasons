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
  template: `
    <div class="adviser-profile">
      <div class="profile-header">
        <h1>Profile Settings</h1>
        <p>Manage your account information</p>
      </div>

      <div class="profile-content">
        <div class="profile-card">
          <div class="profile-avatar">
            <img [src]="profileData.avatar" [alt]="profileData.fullName" class="avatar-img">
            <button class="change-avatar-btn">Change Photo</button>
          </div>
          
          <div class="profile-form">
            <div class="form-group">
              <label for="fullName">Full Name</label>
              <input 
                type="text" 
                id="fullName" 
                [(ngModel)]="profileData.fullName"
                class="form-control"
                [disabled]="!editMode">
            </div>

            <div class="form-group">
              <label for="email">Email Address</label>
              <input 
                type="email" 
                id="email" 
                [(ngModel)]="profileData.email"
                class="form-control"
                [disabled]="!editMode">
            </div>

            <div class="form-group">
              <label for="phone">Phone Number</label>
              <input 
                type="tel" 
                id="phone" 
                [(ngModel)]="profileData.phone"
                class="form-control"
                [disabled]="!editMode">
            </div>

            <div class="form-group">
              <label for="advisoryClass">Advisory Class</label>
              <input 
                type="text" 
                id="advisoryClass" 
                [(ngModel)]="profileData.advisoryClass"
                class="form-control"
                disabled>
            </div>

            <div class="form-actions">
              <button 
                *ngIf="!editMode" 
                class="btn btn-primary" 
                (click)="enableEdit()">
                Edit Profile
              </button>
              <div *ngIf="editMode" class="edit-actions">
                <button class="btn btn-success" (click)="saveProfile()">Save Changes</button>
                <button class="btn btn-secondary" (click)="cancelEdit()">Cancel</button>
              </div>
            </div>
          </div>
        </div>

        <div class="additional-settings">
          <div class="settings-card">
            <h3>Account Settings</h3>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-title">Change Password</div>
                <div class="setting-description">Update your account password</div>
              </div>
              <button class="btn btn-outline">Change</button>
            </div>
          </div>

          <div class="settings-card logout-card">
            <h3>Session</h3>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-title">Logout</div>
                <div class="setting-description">Sign out of your account</div>
              </div>
              <button class="btn btn-danger" (click)="logout()">Logout</button>
            </div>
          </div>
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
  styles: [`
    .adviser-profile {
      padding: 2rem;
      background: #f5f7fa;
      min-height: 100vh;
    }

    .profile-header {
      margin-bottom: 2rem;
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

      h1 { font-size: 2rem; color: #2c3e50; margin-bottom: 0.5rem; font-weight: 700; }
      p { color: #7f8c8d; font-size: 1.1rem; margin: 0; }
    }

    .profile-content {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .profile-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      display: flex;
      gap: 2rem;
      align-items: flex-start;
    }

    .profile-avatar {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;

      .avatar-img {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        object-fit: cover;
        border: 4px solid #e9ecef;
      }

      .change-avatar-btn {
        padding: 0.5rem 1rem;
        border: 1px solid #007bff;
        background: white;
        color: #007bff;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s ease;
        &:hover { background: #007bff; color: white; }
      }
    }

    .profile-form {
      flex: 1;

      .form-group {
        margin-bottom: 1.5rem;

        label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #2c3e50; }

        .form-control {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ced4da;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s ease;

          &:focus { outline: none; border-color: #007bff; box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25); }
          &:disabled { background: #f8f9fa; color: #6c757d; }
        }
      }

      .form-actions {
        margin-top: 2rem;
        .edit-actions { display: flex; gap: 1rem; }
      }
    }

    .additional-settings {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .settings-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

      h3 { color: #2c3e50; margin-bottom: 1rem; font-weight: 700; }

      .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 0;
        border-bottom: 1px solid #e9ecef;
        &:last-child { border-bottom: none; }

        .setting-info {
          .setting-title { font-weight: 600; color: #2c3e50; margin-bottom: 0.25rem; }
          .setting-description { color: #7f8c8d; font-size: 0.9rem; }
        }
      }
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.2s ease;

      &.btn-primary { background: #007bff; color: white; &:hover { background: #0056b3; } }
      &.btn-success { background: #28a745; color: white; &:hover { background: #1e7e34; } }
      &.btn-secondary { background: #6c757d; color: white; &:hover { background: #545b62; } }
      &.btn-outline { background: white; color: #007bff; border: 1px solid #007bff; &:hover { background: #007bff; color: white; } }
      &.btn-danger { background: #dc3545; color: white; &:hover { background: #c82333; } }
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

      &.logout-modal {
        max-width: 300px;
        text-align: center;
        padding: 3rem 2rem;

        .spinner {
          width: 50px;
          height: 50px;
          margin: 0 auto 1rem;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        p { font-size: 1.1rem; color: #2c3e50; margin: 0; font-weight: 600; }
      }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .profile-card { flex-direction: column; text-align: center; }
      .additional-settings { grid-template-columns: 1fr; }
    }
  `]
})
export class AdviserProfileComponent implements OnInit {
  editMode = false;
  showLogoutModal = false;
  originalProfileData: any = {};

  profileData = {
    fullName: '',
    email: '',
    phone: '',
    advisoryClass: '',
    avatar: 'assets/user-female.png'
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
      
      // Fetch advisory class from API (same as dashboard)
      if (currentUser.user_id) {
        this.adviserService.getAdvisoryStudents(currentUser.user_id).subscribe({
          next: (response: any) => {
            if (response.success && response.adviser) {
              this.profileData.advisoryClass = response.adviser.advisory_class || 'Not assigned';
            }
          },
          error: () => {
            this.profileData.advisoryClass = 'Not assigned';
          }
        });
      }
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

  logout(): void {
    this.showLogoutModal = true;
    setTimeout(() => {
      this.authService.logout();
      this.router.navigate(['/login']);
    }, 1500);
  }
}
