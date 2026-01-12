import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { StaffService } from '../../../../core/services/staff.service';

@Component({
  selector: 'app-student-medical-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './student-medical-profile.component.html',
  styleUrls: ['./student-medical-profile.component.scss']
})
export class StudentMedicalProfileComponent implements OnInit {
  studentId: number = 0;
  activeTab = 'vitals';
  loading = true;
  error = '';
  hasMedicalRecord = false;

  student = {
    name: '',
    student_number: '',
    grade_section: '',
    blood_type: '',
    email: '',
    phone: '',
    avatar: 'assets/user-male.png'
  };

  vitalsHistory: any[] = [];
  diagnoses: any[] = [];
  treatments: any[] = [];
  medications: any[] = [];
  immunizations: any[] = [];
  allergies: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private staffService: StaffService
  ) {}

  ngOnInit(): void {
    this.studentId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.studentId) {
      this.loadStudentProfile();
    } else {
      this.error = 'Invalid student ID';
      this.loading = false;
    }
  }

  loadStudentProfile(): void {
    this.loading = true;
    this.error = '';
    
    console.log('Loading student profile for student ID:', this.studentId);
    
    this.staffService.getStudentProfile(this.studentId).subscribe({
      next: (response: any) => {
        console.log('Student profile response:', response);
        this.loading = false;
        
        if (response && response.success) {
          // Get student data from either 'student' or 'profile' key
          const studentData = response.student || response.profile || {};
          console.log('Student data:', studentData);
          
          // Ensure all required fields are set
          this.student = {
            name: studentData.name || studentData.first_name || 'Unknown',
            student_number: studentData.student_number || '',
            grade_section: studentData.grade_section || '',
            blood_type: studentData.blood_type || '',
            email: studentData.email || '',
            phone: studentData.phone || '',
            avatar: studentData.avatar || (studentData.gender === 'F' ? 'assets/user-female.png' : 'assets/user-male.png')
          };
          
          this.vitalsHistory = response.vitals || [];
          this.diagnoses = response.diagnoses || [];
          this.treatments = response.treatments || [];
          this.medications = response.medications || [];
          this.immunizations = response.immunizations || [];
          this.allergies = response.allergies || [];
          
          console.log('Processed student:', this.student);
          console.log('Vitals:', this.vitalsHistory);
          console.log('Diagnoses:', this.diagnoses);
          
          // Check if there's any medical record
          this.hasMedicalRecord = 
            this.vitalsHistory.length > 0 ||
            this.diagnoses.length > 0 ||
            this.treatments.length > 0 ||
            this.medications.length > 0 ||
            this.immunizations.length > 0 ||
            this.allergies.length > 0;
            
          console.log('Has medical record:', this.hasMedicalRecord);
        } else {
          this.error = response?.message || 'Failed to load student profile';
          console.error('API returned success: false', response);
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error loading student profile:', err);
        console.error('Error status:', err.status);
        console.error('Error response:', err.error);
        this.error = 'Failed to load student profile. Please try again.';
      }
    });
  }
}
