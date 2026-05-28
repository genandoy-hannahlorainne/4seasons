import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { firstValueFrom } from 'rxjs';

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
    @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@900&family=Albert+Sans:wght@600&display=swap');

    .force-change-password-container {
      position: relative;
      width: 100%;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-image: url('/assets/pdmhs-background.png');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      padding: 2rem;
    }

    .change-password-card {
      background: white;
      padding: 2.5rem;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      width: 100%;
      max-width: 420px;
      position: relative;
      z-index: 10;
    }

    .header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo {
      width: 80px;
      height: 80px;
      margin-bottom: 1.5rem;
    }

    h2 {
      font-family: 'Epilogue', sans-serif;
      text-align: center;
      margin: 0 0 0.5rem 0;
      color: #052355;
      font-size: 32px;
      font-weight: 900;
    }

    .subtitle {
      font-family: 'Albert Sans', sans-serif;
      text-align: center;
      color: #666;
      font-size: 16px;
      margin: 0;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    label {
      font-family: 'Albert Sans', sans-serif;
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #052355;
      font-size: 0.95rem;
    }

    .form-control {
      font-family: 'Albert Sans', sans-serif;
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.3s ease;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #052355;
      box-shadow: 0 0 0 3px rgba(5, 35, 85, 0.1);
    }

    .form-control.error {
      border-color: #dc3545;
    }

    .error-message {
      font-family: 'Albert Sans', sans-serif;
      color: #721c24;
      font-size: 0.875rem;
      margin-top: 0.5rem;
      padding: 0.75rem;
      background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
      border: 1px solid #ffcccc;
      border-left: 4px solid #dc3545;
      border-radius: 8px;
      line-height: 1.5;
    }

    .success-message {
      font-family: 'Albert Sans', sans-serif;
      color: #155724;
      font-size: 0.95rem;
      margin-bottom: 1rem;
      padding: 0.875rem;
      background: linear-gradient(135deg, #f0fff4 0%, #d1fae5 100%);
      border: 1px solid #c3e6cb;
      border-left: 4px solid #28a745;
      border-radius: 8px;
      text-align: center;
      font-weight: 600;
    }

    .btn-submit {
      font-family: 'Albert Sans', sans-serif;
      width: 100%;
      padding: 0.75rem;
      border: none;
      border-radius: 10px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      background-color: #052355;
      color: white;
      margin-top: 0.5rem;
    }

    .btn-submit:hover:not(:disabled) {
      background-color: #041b44;
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
    }

    .btn-submit:active:not(:disabled) {
      transform: translateY(0);
    }

    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .footer {
      text-align: center;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    .footer p {
      font-family: 'Albert Sans', sans-serif;
      color: #666;
      font-size: 0.95rem;
      margin: 0;
    }

    @media (max-width: 640px) {
      .change-password-card {
        padding: 2rem 1.5rem;
      }

      h2 {
        font-size: 28px;
      }

      .logo {
        width: 70px;
        height: 70px;
      }
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

  async ngOnInit(): Promise<void> {
    let user = this.authService.currentUserValue;

    if (!user) {
      try {
        user = await firstValueFrom(this.authService.getCurrentUser(true));
      } catch {
        this.router.navigate(['/login']);
        return;
      }
    }

    if (!user?.password_must_change) {
      const roleRoutes: { [key: string]: string } = {
        'Student': '/dashboard/student',
        'Adviser': '/dashboard/adviser',
        'Clinic Staff': '/dashboard/staff',
        'Admin': '/dashboard/admin'
      };

      const route = roleRoutes[user?.role_name || ''] || '/dashboard';
      this.router.navigate([route]);
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
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'An error occurred while changing password';
      }
    });
  }
}
