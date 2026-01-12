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
    <div class="admin-login-container">
      <div class="admin-login-card">
        <div class="admin-header">
          <div class="admin-icon">🛡️</div>
          <h1>Admin Portal</h1>
          <p>Authorized personnel only</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="username">Username</label>
            <input 
              type="text" 
              id="username" 
              formControlName="username" 
              class="form-control"
              placeholder="Enter admin username"
              autocomplete="username">
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password" 
              class="form-control"
              placeholder="Enter password"
              autocomplete="current-password">
          </div>

          <div class="error-message" *ngIf="error">
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
          <a href="/login">← Back to main site</a>
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
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      padding: 1rem;
    }

    .admin-login-card {
      background: white;
      border-radius: 16px;
      padding: 2.5rem;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .admin-header {
      text-align: center;
      margin-bottom: 2rem;

      .admin-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      h1 {
        font-size: 1.75rem;
        color: #1a1a2e;
        margin-bottom: 0.5rem;
        font-weight: 700;
      }

      p {
        color: #7f8c8d;
        font-size: 0.9rem;
      }
    }

    .form-group {
      margin-bottom: 1.5rem;

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: #2c3e50;
      }

      .form-control {
        width: 100%;
        padding: 0.875rem 1rem;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        font-size: 1rem;
        transition: all 0.2s ease;
        box-sizing: border-box;

        &:focus {
          outline: none;
          border-color: #1a1a2e;
          box-shadow: 0 0 0 3px rgba(26, 26, 46, 0.1);
        }

        &::placeholder {
          color: #adb5bd;
        }
      }
    }

    .error-message {
      background: #fee2e2;
      color: #dc2626;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
      text-align: center;
    }

    .btn-login {
      width: 100%;
      padding: 1rem;
      background: #1a1a2e;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;

      &:hover:not(:disabled) {
        background: #16213e;
        transform: translateY(-1px);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .spinner {
        width: 18px;
        height: 18px;
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
      border-top: 1px solid #e9ecef;

      a {
        color: #7f8c8d;
        text-decoration: none;
        font-size: 0.9rem;
        transition: color 0.2s ease;

        &:hover {
          color: #1a1a2e;
        }
      }
    }
  `]
})
export class AdminLoginComponent {
  loginForm: FormGroup;
  loading = false;
  error = '';

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
        if (user && (user.role_name === 'admin' || user.role_name === 'Admin')) {
          this.router.navigate(['/dashboard/admin']);
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
