import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { StudentService } from '../../../../core/services/student.service';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class StudentProfileComponent implements OnInit {
  profileForm: FormGroup;
  isEditing = false;
  loading = false;
  currentUser: any;
  errorMessage = '';
  successMessage = '';

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
      emergencyContact: ['', Validators.required],
      contactNumber: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
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
          
          // Convert gender from database format to form format
          const genderMap: any = { 'M': 'male', 'F': 'female', 'Other': 'other' };
          const gender = genderMap[profile.gender] || 'other';
          
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
            emergencyContact: profile.emergency_contact || '',
            contactNumber: profile.contact_number || '',
            email: profile.email || ''
          });
          
          // Disable form after loading
          this.profileForm.disable();
          console.log('Form values after patch:', this.profileForm.value);
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
    if (this.profileForm.invalid) {
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

    this.studentService.updateStudentProfile(this.currentUser.user_id, profileData).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.successMessage = 'Profile updated successfully!';
          this.isEditing = false;
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
        this.loading = false;
        this.errorMessage = err.error?.message || 'Error updating profile';
        console.error('Error updating profile:', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
