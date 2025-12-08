import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

type UserRole = 'student' | 'adviser' | 'clinic-staff' | null;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  selectedRole: UserRole = null;
  registerForm: FormGroup;
  loading = false;
  error = '';
  showModal = false;
  modalMessage = '';
  modalSuccess = false;
  registeredUsername = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({});
  }

  selectRole(role: UserRole): void {
    this.selectedRole = role;
    this.buildForm();
  }

  private buildForm(): void {
    if (this.selectedRole === 'student') {
      this.registerForm = this.fb.group({
        studentNumber: ['', Validators.required],
        firstName: ['', Validators.required],
        middleName: [''],
        lastName: ['', Validators.required],
        gender: ['', Validators.required],
        birthday: ['', Validators.required],
        contactNumber: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]]
      });
    } else {
      // Adviser or Clinic Staff
      this.registerForm = this.fb.group({
        firstName: ['', Validators.required],
        middleName: [''],
        lastName: ['', Validators.required],
        email: ['', Validators.email],
        contactNumber: [''],
        password: ['', [Validators.required, Validators.minLength(6)]]
      });
    }
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    const formData = {
      ...this.registerForm.value,
      role: this.selectedRole
    };
    
    // Log for debugging
    console.log('Sending registration data:', { ...formData, password: '***' });

    this.authService.register(formData).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.modalSuccess = true;
          this.registeredUsername = response.username;
          this.modalMessage = `Registration successful! Please save your username - you'll need it to login.`;
          this.showModal = true;
        } else {
          this.modalSuccess = false;
          this.modalMessage = response.message || 'Registration failed. Please try again.';
          this.showModal = true;
        }
      },
      error: (err) => {
        this.loading = false;
        this.modalSuccess = false;
        
        // Better error handling
        let errorMessage = 'Registration failed. Please try again.';
        
        if (err.status === 0) {
          errorMessage = 'Cannot connect to server. Please make sure Docker is running (docker-compose up)';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.message) {
          errorMessage = err.message;
        } else if (err.status === 400) {
          errorMessage = 'Invalid registration data. Please check all required fields.';
        } else if (err.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        this.modalMessage = errorMessage;
        this.showModal = true;
        
        // Log to console for debugging
        console.error('Registration error:', err);
      }
    });
  }

  goBack(): void {
    this.selectedRole = null;
    this.registerForm = this.fb.group({});
  }

  closeModal(): void {
    this.showModal = false;
    if (this.modalSuccess) {
      this.router.navigate(['/login']);
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  copyUsername(): void {
    navigator.clipboard.writeText(this.registeredUsername).then(() => {
      // Optional: Show a brief "Copied!" message
      const originalMessage = this.modalMessage;
      this.modalMessage = 'Username copied to clipboard!';
      setTimeout(() => {
        this.modalMessage = originalMessage;
      }, 2000);
    });
  }
}
