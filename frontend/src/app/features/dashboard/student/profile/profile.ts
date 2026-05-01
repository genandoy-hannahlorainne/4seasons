import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QRCodeComponent } from 'angularx-qrcode';
import { AuthService } from '../../../../core/services/auth.service';
import { StudentService } from '../../../../core/services/student.service';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, QRCodeComponent],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class StudentProfileComponent implements OnInit {
  profileForm: FormGroup;
  changePasswordForm: FormGroup;
  isEditing = false;
  showEditModal = false;
  editError = '';
  saving = false;
  editForm = { email: '', contactNumber: '', address: '', birthday: '' };
  loading = false;
  showPasswordModal = false;
  showRequestPasswordModal = false;
  showLogoutModal = false;
  passwordLoading = false;
  submittingRequest = false;
  currentUser: any;
  errorMessage = '';
  successMessage = '';
  passwordError = '';
  passwordSuccess = '';
  passwordRequestReason = '';
  passwordRequestNewPassword = '';
  passwordRequestConfirmPassword = '';
  requestPasswordError = '';

  // Display values
  displayName = '';
  displayGender = '';
  displayBirthday = '';
  displayStudentNumber = '';

  // QR Code data
  qrCodeData = '';
  qrCodeLoading = false;
  showQRModal = false;
  studentId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private studentService: StudentService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      studentNumber: [{ value: '', disabled: true }],
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      gender: ['', Validators.required],
      birthday: ['', Validators.required],
      gradeLevel: ['', Validators.required],
      section: ['', Validators.required],
      address: ['', Validators.required],
      bloodType: [''],
      contactNumber: [''],
      email: ['', [Validators.email]]
    });

    this.changePasswordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  getProfileIcon(): string {
    const gender = this.profileForm.get('gender')?.value;
    if (gender === 'male') {
      return 'assets/user-male.png';
    } else if (gender === 'female') {
      return 'assets/user-female.png';
    }
    return 'assets/user-male.png'; // default
  }

  formatDisplayDate(dateString: string): string {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';

      // Return in a readable format like "March 29, 2006"
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      // Error formatting date
      return '';
    }
  }

  loadUserProfile(): void {
    this.currentUser = this.authService.currentUserValue;

    // Current user fetched

    if (!this.currentUser || !this.currentUser.user_id) {
      this.errorMessage = 'User not logged in. Please login again.';
      return;
    }

    this.loading = true;

    this.studentService.getStudentProfile(this.currentUser.user_id).subscribe({
      next: (response) => {
        this.loading = false;

        if (response.success && response.profile) {
          const profile = response.profile;
          // Profile data received

          // Convert gender from database format to form format
          const genderMap: any = { 'M': 'male', 'F': 'female', 'Other': 'other' };
          const gender = genderMap[profile.gender] || 'other';

          // Store student_id for QR code generation
          this.studentId = profile.student_id;

          // Set display values
          this.displayName = `${profile.first_name} ${profile.middle_name || ''} ${profile.last_name}`.trim();
          this.displayGender = genderMap[profile.gender] || 'other';
          this.displayBirthday = this.formatDisplayDate(profile.birth_date);
          this.displayStudentNumber = profile.student_number;

          this.profileForm.patchValue({
            studentNumber: profile.student_number,
            firstName: profile.first_name,
            middleName: profile.middle_name || '',
            lastName: profile.last_name,
            gender: gender,
            birthday: profile.birth_date,
            gradeLevel: profile.grade_level || '',
            section: profile.section || '',
            address: profile.address || '',
            bloodType: profile.blood_type || '',
            contactNumber: profile.contact_number || profile.phone || '',
            email: profile.email || ''
          });

          // Debug log to verify phone number is set
          // Contact number set

          // Disable form after loading
          this.profileForm.disable();

          // Load QR code
          this.loadQRCode();
        } else {
          this.errorMessage = 'Failed to load profile';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Error loading profile. Please try again.';
        // Error loading profile
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;

    if (this.isEditing) {
      this.profileForm.enable();
      this.profileForm.get('studentNumber')?.disable();
    } else {
      this.profileForm.disable();
      this.loadUserProfile(); // Reset to original values
    }
  }

  openEditModal(): void {
    this.editForm = {
      email: this.profileForm.getRawValue().email || '',
      contactNumber: this.profileForm.getRawValue().contactNumber || '',
      address: this.profileForm.getRawValue().address || '',
      birthday: this.profileForm.getRawValue().birthday || ''
    };
    this.editError = '';
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editError = '';
  }

  saveProfile(): void {
    if (!this.studentId) { this.editError = 'Student profile not loaded.'; return; }
    this.saving = true;
    this.editError = '';

    const profileData = {
      ...this.profileForm.getRawValue(),
      email: this.editForm.email,
      contactNumber: this.editForm.contactNumber,
      address: this.editForm.address,
      birthday: this.editForm.birthday
    };

    this.studentService.updateStudentProfile(this.studentId, profileData).subscribe({
      next: (response) => {
        this.saving = false;
        if (response.success) {
          this.profileForm.patchValue({
            email: this.editForm.email,
            contactNumber: this.editForm.contactNumber,
            address: this.editForm.address,
            birthday: this.editForm.birthday
          });
          this.displayBirthday = this.formatDisplayDate(this.editForm.birthday);
          this.closeEditModal();
          this.successMessage = 'Profile updated successfully!';
          setTimeout(() => this.successMessage = '', 3000);
        } else {
          this.editError = response.message || 'Failed to update profile.';
        }
      },
      error: (err) => {
        this.saving = false;
        this.editError = err.error?.message || 'Error updating profile.';
      }
    });
  }

  onSubmit(): void {
    // onSubmit called

    if (this.profileForm.invalid) {
      // Form is invalid
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }

    if (!this.currentUser || !this.currentUser.user_id) {
      this.errorMessage = 'User not logged in';
      return;
    }

    if (!this.studentId) {
      this.errorMessage = 'Student profile not loaded yet';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const profileData = this.profileForm.getRawValue();

    this.studentService.updateStudentProfile(this.studentId!, profileData).subscribe({
      next: (response) => {
        // Update response received
        this.loading = false;
        if (response.success) {
          this.successMessage = 'Profile updated successfully!';
          this.isEditing = false;

          // Update form with current values and disable it
          this.profileForm.patchValue(profileData);
          this.profileForm.disable();

          // Clear success message after 3 seconds
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        } else {
          this.errorMessage = response.message || 'Failed to update profile';
        }
      },
      error: (err) => {
        // Update error
        this.loading = false;
        this.errorMessage = err.error?.message || 'Error updating profile';
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/student']);
  }

  logout(): void {
    this.showLogoutModal = true;

    // Logout after showing the modal
    setTimeout(() => {
      this.authService.logout();
      window.location.replace('/login');
    }, 1500);
  }

  changePassword(): void {
    this.showPasswordModal = true;
    this.passwordError = '';
    this.passwordSuccess = '';
    this.changePasswordForm.reset();
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.changePasswordForm.reset();
    this.passwordError = '';
    this.passwordSuccess = '';
  }

  onChangePasswordSubmit(): void {
    if (this.changePasswordForm.invalid) {
      return;
    }

    if (!this.currentUser || !this.currentUser.user_id) {
      this.passwordError = 'User not logged in';
      return;
    }

    this.passwordLoading = true;
    this.passwordError = '';
    this.passwordSuccess = '';

    const formData = this.changePasswordForm.value;

    this.authService.changePassword(
      this.currentUser.user_id,
      formData.currentPassword,
      formData.newPassword
    ).subscribe({
      next: (response) => {
        this.passwordLoading = false;
        if (response.success) {
          this.passwordSuccess = 'Password changed successfully!';
          setTimeout(() => {
            this.closePasswordModal();
          }, 2000);
        } else {
          this.passwordError = response.message || 'Failed to change password';
        }
      },
      error: (err) => {
        this.passwordLoading = false;
        this.passwordError = err.error?.message || 'Error changing password';
      }
    });
  }

  loadQRCode(): void {
    if (!this.studentId) {
      // Cannot load QR code: studentId is null
      return;
    }
    this.qrCodeLoading = true;

    // Generate QR code data as JSON string
    const qrData = {
      student_id: this.studentId,
      student_number: this.profileForm.get('studentNumber')?.value,
      name: `${this.profileForm.get('firstName')?.value} ${this.profileForm.get('lastName')?.value}`,
      timestamp: new Date().toISOString()
    };

    this.qrCodeData = JSON.stringify(qrData);
    this.qrCodeLoading = false;

    // QR Code data generated
  }

  viewQRCode(): void {
    this.showQRModal = true;
  }

  closeQRModal(): void {
    this.showQRModal = false;
  }

  downloadQRCode(): void {
    // Get the QR code canvas element and download it
    const canvas = document.querySelector('.qr-code-container canvas') as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `student-qr-${this.profileForm.get('studentNumber')?.value}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } else {
      // Fallback: try to get the image
      const img = document.querySelector('.qr-code-container img') as HTMLImageElement;
      if (img) {
        const link = document.createElement('a');
        link.download = `student-qr-${this.profileForm.get('studentNumber')?.value}.png`;
        link.href = img.src;
        link.click();
      }
    }
  }

  requestPasswordChange(): void {
    this.requestPasswordError = '';
    this.passwordRequestReason = '';
    this.passwordRequestNewPassword = '';
    this.passwordRequestConfirmPassword = '';
    this.showRequestPasswordModal = true;
  }

  closeRequestPasswordModal(): void {
    this.showRequestPasswordModal = false;
    this.passwordRequestReason = '';
    this.passwordRequestNewPassword = '';
    this.passwordRequestConfirmPassword = '';
    this.requestPasswordError = '';
  }

  submitPasswordRequest(): void {
    this.submittingRequest = true;
    this.requestPasswordError = '';

    // Validation
    if (!this.passwordRequestNewPassword) {
      this.requestPasswordError = 'Please enter a new password';
      this.submittingRequest = false;
      return;
    }

    if (this.passwordRequestNewPassword.length < 6) {
      this.requestPasswordError = 'Password must be at least 6 characters';
      this.submittingRequest = false;
      return;
    }

    if (this.passwordRequestNewPassword !== this.passwordRequestConfirmPassword) {
      this.requestPasswordError = 'Passwords do not match';
      this.submittingRequest = false;
      return;
    }

    this.authService.requestPasswordChange(this.passwordRequestReason, this.passwordRequestNewPassword).subscribe({
      next: (response) => {
        this.submittingRequest = false;
        this.closeRequestPasswordModal();
        this.successMessage = 'Password change request submitted successfully! Admin will review your request.';
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (err) => {
        this.submittingRequest = false;
        this.requestPasswordError = err.error?.message || 'Failed to submit request. Please try again.';
      }
    });
  }
}

