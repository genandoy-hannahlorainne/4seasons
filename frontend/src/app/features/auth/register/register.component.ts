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

    this.authService.register(formData).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.modalSuccess = true;
          this.modalMessage = `Registration successful! Your username is: ${response.username}`;
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
        this.modalMessage = err.error?.message || 'Registration failed. Please check your connection and try again.';
        this.showModal = true;
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
}
