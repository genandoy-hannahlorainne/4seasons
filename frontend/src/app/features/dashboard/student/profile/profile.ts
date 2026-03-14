import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { QRCodeComponent } from 'angularx-qrcode';
import { AuthService } from '../../../../core/services/auth.service';
import { StudentService } from '../../../../core/services/student.service';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QRCodeComponent],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class StudentProfileComponent implements OnInit {
  profileForm: FormGroup;
  changePasswordForm: FormGroup;
  isEditing = false;
  loading = false;
  showPasswordModal = false;
  showLogoutModal = false;
  passwordLoading = false;
  currentUser: any;
  errorMessage = '';
  successMessage = '';
  passwordError = '';
  passwordSuccess = '';
  
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
      contactNumber: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
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
      console.error('Error formatting date:', error);
      return '';
    }
  }

  loadUserProfile(): void {
    this.currentUser = this.authService.currentUserValue;
    
    console.log('Current User:', this.currentUser);
    
    if (!this.currentUser || !this.currentUser.user_id) {
      this.errorMessage = 'User not logged in. Please login again.';
      console.error('No user logged in');
      return;
    }

    this.loading = true;
    console.log('Fetching profile for user_id:', this.currentUser.user_id);
    
    this.studentService.getStudentProfile(this.currentUser.user_id).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Profile API Response:', response);
        
        if (response.success && response.profile) {
          const profile = response.profile;
          console.log('Profile data:', profile);
          console.log('Phone number from API:', profile.phone, profile.contact_number);
          
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
          console.log('Contact number set to:', profile.contact_number || profile.phone || '');
          
          // Disable form after loading
          this.profileForm.disable();
          console.log('Form values after patch:', this.profileForm.value);
          
          // Load QR code
          this.loadQRCode();
        } else {
          this.errorMessage = 'Failed to load profile';
          console.error('API returned success=false');
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Error loading profile. Please try again.';
        console.error('Error loading profile:', err);
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

  onSubmit(): void {
    console.log('onSubmit called');
    console.log('Form valid:', !this.profileForm.invalid);
    console.log('Form values:', this.profileForm.getRawValue());
    
    if (this.profileForm.invalid) {
      console.error('Form is invalid');
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }

    if (!this.currentUser || !this.currentUser.user_id) {
      this.errorMessage = 'User not logged in';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const profileData = this.profileForm.getRawValue();
    console.log('Sending profile data:', profileData);

    this.studentService.updateStudentProfile(this.currentUser.user_id, profileData).subscribe({
      next: (response) => {
        console.log('Update response:', response);
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
        console.error('Update error:', err);
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
      this.router.navigate(['/login']);
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
      console.error('Cannot load QR code: studentId is null');
      return;
    }

    console.log('Loading QR code for student_id:', this.studentId);
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
    
    console.log('QR Code data:', this.qrCodeData);
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
}
