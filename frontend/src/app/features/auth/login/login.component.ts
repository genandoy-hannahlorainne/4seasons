import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PushNotificationService } from '../../../core/services/push-notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  error = '';
  selectedRole: string = '';
  showPassword = false;
  showForgotPassword = false;
  showContactModal = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private pushNotificationService: PushNotificationService
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Get role from query params
    this.route.queryParams.subscribe(params => {
      this.selectedRole = params['role'] || '';
      
      // If no role selected, redirect back to role selection
      if (!this.selectedRole) {
        this.router.navigate(['/role-selection']);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleForgotPassword(): void {
    this.showForgotPassword = !this.showForgotPassword;
  }

  toggleContactModal(): void {
    this.showContactModal = !this.showContactModal;
  }

  goBack(): void {
    this.router.navigate(['/role-selection']);
  }

  getRoleDisplayName(): string {
    const roleMap: { [key: string]: string } = {
      'student': 'Student',
      'adviser': 'Adviser',
      'clinic-staff': 'Clinic Staff'
    };
    return roleMap[this.selectedRole] || '';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    // STRICT VALIDATION: Must have selected role
    if (!this.selectedRole) {
      this.error = 'Invalid session. Please start from role selection.';
      this.router.navigate(['/role-selection']);
      return;
    }

    this.loading = true;
    this.error = '';

    // iOS Safari requires permission to be requested from a direct user gesture.
    // Pre-request here (before the async HTTP call) so it counts as user-initiated.
    if (this.selectedRole === 'adviser' && this.pushNotificationService.isSupported()) {
      Notification.requestPermission().catch(() => {});
    }

    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: (user) => {
        this.loading = false;

        // Check if password must be changed
        if (user.password_must_change) {
          this.router.navigate(['/force-change-password']);
          return;
        }

        // Map selected role to expected role name
        const roleMap: { [key: string]: string } = {
          'student': 'Student',
          'adviser': 'Adviser',
          'clinic-staff': 'Clinic Staff'
        };

        const expectedRole = roleMap[this.selectedRole];
        const userRole = user.role_name;

        // STRICT VALIDATION: User role MUST match selected role exactly
        if (userRole !== expectedRole) {
          this.authService.logout();
          this.error = `You selected to login as "${expectedRole}" but this account belongs to "${userRole}". Please use the correct account for ${expectedRole}.`;
          // Security: Role mismatch detected
          return;
        }

        // Check if admin - redirect to admin login instead
        if (user.role_name === 'admin' || user.role_name === 'Admin') {
          this.authService.logout();
          this.error = 'Please use the admin portal to login.';
          return;
        }

        // All validations passed - redirect to appropriate dashboard
        const roleRoutes: { [key: string]: string } = {
          'Student': '/dashboard/student',
          'Adviser': '/dashboard/adviser',
          'Clinic Staff': '/dashboard/staff'
        };
        
        const route = roleRoutes[user.role_name] || '/dashboard/student';
        this.router.navigate([route], { replaceUrl: true });
      },
      error: (err) => {
        this.loading = false;
        // Check if error is from backend role validation
        if (err.status === 403) {
          this.error = err.error?.message || 'Access denied. Your account profile is incomplete or inactive.';
          // Security: Backend role validation failed
        } else {
          this.error = err.error?.message || 'Invalid username or password. Please check your credentials and try again.';
        }
      }
    });
  }
}
