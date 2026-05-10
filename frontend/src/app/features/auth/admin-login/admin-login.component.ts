import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="admin-login-container" [style.backgroundImage]="'url(assets/pdmhs-background.png)'"  [style.backgroundSize]="'cover'" [style.backgroundPosition]="'center'">
      <div class="admin-login-card">
        <div class="admin-header">
          <div class="admin-icon-wrapper">
            <i class="bi bi-shield-lock-fill" style="font-size:48px;color:#052355;"></i>
          </div>
          <h1>Admin Portal</h1>
          <p>Authorized personnel only</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="username">Username</label>
            <div class="input-wrapper">
              <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input 
                type="text" 
                id="username" 
                formControlName="username" 
                class="form-control"
                placeholder="Enter admin username"
                autocomplete="username">
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <div class="input-wrapper">
              <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input 
                [type]="showPassword ? 'text' : 'password'" 
                id="password" 
                formControlName="password" 
                class="form-control"
                placeholder="Enter password"
                autocomplete="current-password">
              <button 
                type="button" 
                class="password-toggle" 
                (click)="togglePasswordVisibility()"
                tabindex="-1">
                <svg *ngIf="!showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <svg *ngIf="showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              </button>
            </div>
          </div>

          <div class="error-message" *ngIf="error">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ error }}
          </div>

          <button 
            type="submit" 
            class="btn-login" 
            [disabled]="loading || loginForm.invalid">
            <span *ngIf="loading" class="spinner"></span>
            {{ loading ? 'Authenticating...' : 'Login' }}
          </button>
        </form>

        <div class="back-link">
          <a href="/login">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to main site
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        pointer-events: none;
      }
    }

    .admin-login-card {
      background: rgba(255, 255, 255, 0.97);
      backdrop-filter: blur(20px);
      border-radius: 20px;
      padding: 2.75rem 2.5rem;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.05);
      position: relative;
      z-index: 1;
      animation: slideUp 0.4s ease;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .admin-header {
      text-align: center;
      margin-bottom: 2rem;

      .admin-icon-wrapper {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: linear-gradient(135deg, #e8f0fe 0%, #dbeafe 100%);
        box-shadow: 0 4px 20px rgba(59, 130, 246, 0.2);
        margin-bottom: 1.25rem;
        overflow: hidden;
        flex-shrink: 0;
      }

      .admin-icon-img {
        width: 44px;
        height: 44px;
        object-fit: contain;
        display: block;
      }

      h1 {
        font-family: 'Epilogue', sans-serif;
        font-size: 2rem;
        color: #052355;
        margin: 0 0 0.4rem;
        font-weight: 900;
        letter-spacing: -0.5px;
      }

      p {
        font-family: 'Albert Sans', sans-serif;
        color: #666;
        font-size: 0.95rem;
        margin: 0;
        letter-spacing: 0.3px;
      }
    }

    .form-group {
      margin-bottom: 1.25rem;

      label {
        font-family: 'Albert Sans', sans-serif;
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        font-size: 0.95rem;
        color: #052355;
      }

      .input-wrapper {
        position: relative;

        .input-icon {
          position: absolute;
          left: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          width: 17px;
          height: 17px;
          min-width: 17px;
          min-height: 17px;
          color: #94a3b8;
          pointer-events: none;
        }

        .form-control {
          width: 100%;
          padding: 0.875rem 3rem 0.875rem 2.75rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-family: 'Albert Sans', sans-serif;
          font-size: 0.95rem;
          color: #0f172a;
          background: #f8fafc;
          transition: all 0.2s ease;
          box-sizing: border-box;

          &:focus {
            outline: none;
            border-color: #052355;
            background: #fff;
            box-shadow: 0 0 0 3px rgba(5, 35, 85, 0.12);
          }

          &::placeholder {
            color: #cbd5e1;
          }

          /* Hide Edge/IE password reveal button */
          &::-ms-reveal,
          &::-ms-clear {
            display: none;
          }
        }

        .password-toggle {
          position: absolute;
          right: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          transition: color 0.2s ease;

          &:hover {
            color: #052355;
          }

          &:focus {
            outline: none;
          }

          svg {
            display: block;
          }
        }
      }
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      margin-bottom: 1.25rem;
      font-size: 0.875rem;
    }

    .btn-login {
      font-family: 'Albert Sans', sans-serif;
      width: 100%;
      padding: 0.75rem;
      background: #052355;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      letter-spacing: 0.3px;
      transition: all 0.25s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      box-shadow: 0 4px 15px rgba(5, 35, 85, 0.35);

      &:hover:not(:disabled) {
        background: #041b44;
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(5, 35, 85, 0.45);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        opacity: 0.65;
        cursor: not-allowed;
        box-shadow: none;
      }

      .spinner {
        width: 17px;
        height: 17px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .back-link {
      text-align: center;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #f1f5f9;

      a {
        font-family: 'Albert Sans', sans-serif;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        color: #666;
        text-decoration: none;
        font-size: 0.95rem;
        font-weight: 600;
        transition: color 0.2s ease;

        &:hover {
          color: #052355;
        }
      }
    }
  `]
})
export class AdminLoginComponent {
  loginForm: FormGroup;
  loading = false;
  error = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    // If already logged in as admin, redirect to admin dashboard
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.role_name === 'admin') {
      this.router.navigate(['/dashboard/admin']);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    const { username, password } = this.loginForm.value;

    // Use AuthService login method
    this.authService.login(username, password).subscribe({
      next: (user) => {
        this.loading = false;

        // Check if password must be changed
        if (user.password_must_change) {
          this.router.navigate(['/force-change-password']);
          return;
        }

        if (user && (user.role_name === 'admin' || user.role_name === 'Admin')) {
          this.router.navigate(['/dashboard/admin'], { replaceUrl: true });
        } else {
          this.error = 'Access denied. Admin credentials required.';
          this.authService.logout();
        }
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 0) {
          this.error = 'Cannot connect to server';
        } else {
          this.error = err.error?.message || 'Login failed';
        }
      }
    });
  }
}
