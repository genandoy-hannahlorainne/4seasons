import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-force-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="force-change-password-container">
      <div class="change-password-card">
        <div class="header">
          <img src="assets/pdmhs-logo.png" alt="PDMHS Logo" class="logo" />
          <h2>Change Password Required</h2>
          <p class="subtitle">For security reasons, you must change your password before continuing.</p>
        </div>

        <form [formGroup]="changePasswordForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              formControlName="currentPassword"
              class="form-control"
              [class.error]="isFieldInvalid('currentPassword')"
              placeholder="Enter your current password"
            />
            <div class="error-message" *ngIf="isFieldInvalid('currentPassword')">
              Current password is required
            </div>
          </div>

          <div class="form-group">
            <label for="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              formControlName="newPassword"
              class="form-control"
              [class.error]="isFieldInvalid('newPassword')"
              placeholder="Enter new password (min 8 characters)"
            />
            <div class="error-message" *ngIf="changePasswordForm.get('newPassword')?.hasError('required') && changePasswordForm.get('newPassword')?.touched">
              New password is required
            </div>
            <div class="error-message" *ngIf="changePasswordForm.get('newPassword')?.hasError('minlength') && changePasswordForm.get('newPassword')?.touched">
              Password must be at least 8 characters long
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              formControlName="confirmPassword"
              class="form-control"
              [class.error]="isFieldInvalid('confirmPassword') || changePasswordForm.hasError('passwordMismatch')"
              placeholder="Confirm your new password"
            />
            <div class="error-message" *ngIf="isFieldInvalid('confirmPassword')">
              Please confirm your password
            </div>
            <div class="error-message" *ngIf="changePasswordForm.hasError('passwordMismatch') && changePasswordForm.get('confirmPassword')?.touched">
              Passwords do not match
            </div>
          </div>

          <div class="error-message" *ngIf="error">
            {{ error }}
          </div>

          <div class="success-message" *ngIf="success">
            {{ success }}
          </div>

          <button 
            type="submit" 
            class="btn-submit" 
            [disabled]="loading || changePasswordForm.invalid"
          >
            {{ loading ? 'Changing Password...' : 'Change Password' }}
          </button>
        </form>

        <div class="footer">
          <p>Need help? Contact your system administrator.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .force-change-password-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .change-password-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      padding: 40px;
      max-width: 500px;
      width: 100%;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
    }

    .logo {
      width: 80px;
      height: 80px;
      margin-bottom: 20px;
    }

    h2 {
      color: #333;
      margin: 0 0 10px 0;
      font-size: 24px;
      font-weight: 600;
    }

    .subtitle {
      color: #666;
      font-size: 14px;
      margin: 0;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 500;
      font-size: 14px;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.3s;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
    }

    .form-control.error {
      border-color: #dc3545;
    }

    .error-message {
      color: #dc3545;
      font-size: 12px;
      margin-top: 5px;
      padding: 8px;
      background-color: #f8d7da;
      border-radius: 4px;
    }

    .success-message {
      color: #28a745;
      font-size: 14px;
      margin-bottom: 15px;
      padding: 12px;
      background-color: #d4edda;
      border-radius: 4px;
      text-align: center;
    }

    .btn-submit {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      margin-top: 10px;
    }

    .btn-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }

    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }

    .footer p {
      color: #666;
      font-size: 13px;
      margin: 0;
    }
  `]
})
export class ForceChangePasswordComponent implements OnInit {
  changePasswordForm: FormGroup;
  loading = false;
  error = '';
  success = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      this.router.navigate(['/login']);
    }
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (!newPassword || !confirmPassword) {
      return null;
    }

    return newPassword.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.changePasswordForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  onSubmit(): void {
    if (this.changePasswordForm.invalid) {
      Object.keys(this.changePasswordForm.controls).forEach(key => {
        this.changePasswordForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const { currentPassword, newPassword } = this.changePasswordForm.value;

    this.http.post<any>(`${environment.apiUrl}/force-change-password`, {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPassword
    }).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.success = 'Password changed successfully! Redirecting...';
          
          // Update user data in localStorage to clear password_must_change flag
          const currentUser = localStorage.getItem('currentUser');
          if (currentUser) {
            const user = JSON.parse(currentUser);
            user.password_must_change = false; // Clear the flag
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // Also update the auth service's current user subject
            // This ensures any components listening to currentUser observable get the update
            this.authService.updateCurrentUser(user);
            
            const roleRoutes: { [key: string]: string } = {
              'Student': '/dashboard/student',
              'Adviser': '/dashboard/adviser',
              'Clinic Staff': '/dashboard/staff',
              'Admin': '/dashboard/admin'
            };
            
            const route = roleRoutes[user.role_name] || '/dashboard';
            
            setTimeout(() => {
              this.router.navigate([route]);
            }, 2000);
          }
        } else {
          this.error = response.message || 'Failed to change password';
        }
      },
      error: (err) => {
        this.http.post<any>(`${environment.apiUrl}/force-change-password`, {
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: newPassword
        }).subscribe({
          next: (response) => {
            this.loading = false;
            if (response.success) {
              this.success = 'Password changed successfully! Redirecting...';

              const currentUser = localStorage.getItem('currentUser');
              if (currentUser) {
                const user = JSON.parse(currentUser);
                user.password_must_change = false;
                localStorage.setItem('currentUser', JSON.stringify(user));
                this.authService.updateCurrentUser(user);

                const roleRoutes: { [key: string]: string } = {
                  'Student': '/dashboard/student',
                  'Adviser': '/dashboard/adviser',
                  'Clinic Staff': '/dashboard/staff',
                  'Admin': '/dashboard/admin'
                };

                const route = roleRoutes[user.role_name] || '/dashboard';

                setTimeout(() => {
                  this.router.navigate([route]);
                }, 2000);
              }
            } else {
              this.error = response.message || 'Failed to change password';
            }
          },
          error: (legacyErr) => {
            this.loading = false;
            this.error = legacyErr.error?.message || err.error?.message || 'An error occurred while changing password';
          }
        });
      }
    });
  }
}
