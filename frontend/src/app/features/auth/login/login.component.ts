import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

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

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
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
    });
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

    this.loading = true;
    this.error = '';

    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: (user) => {
        // Check if admin - redirect to admin login instead
        if (user.role_name === 'admin' || user.role_name === 'Admin') {
          this.authService.logout();
          this.error = 'Please use the admin portal to login.';
          this.loading = false;
          return;
        }

        // Redirect based on user role (no admin here)
        const roleRoutes: { [key: string]: string } = {
          'Student': '/dashboard/student',
          'Adviser': '/dashboard/adviser',
          'Clinic Staff': '/dashboard/staff'
        };
        
        const route = roleRoutes[user.role_name] || '/dashboard/student';
        this.router.navigate([route]);
      },
      error: (err) => {
        this.error = 'Invalid username or password';
        this.loading = false;
      }
    });
  }
}
