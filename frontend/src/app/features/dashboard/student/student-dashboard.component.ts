import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { StudentService } from '../../../core/services/student.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.scss']
})
export class StudentDashboardComponent implements OnInit {
  // Student information
  studentName = 'User';
  studentId = '';
  gradeLevel = '';
  
  // Info cards data
  bmi = '--';
  bloodType = '--';
  allergiesCount = '0';
  lastVisit = '--';
  
  // Medical information
  height = '--';
  weight = '--';
  age = '--';
  bmiPercentage = '--';
  
  // Known allergies
  knownAllergies: string[] = [];
  
  // Immunization records
  immunizationRecords: any[] = [];
  
  loading = true;
  error = '';

  constructor(
    private studentService: StudentService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStudentData();
  }

  loadStudentData(): void {
    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser || !currentUser.user_id) {
      this.error = 'User not logged in';
      this.loading = false;
      return;
    }

    // Fetch student profile
    this.studentService.getStudentProfile(currentUser.user_id).subscribe({
      next: (response) => {
        if (response.success && response.profile) {
          const profile = response.profile;
          
          // Set basic info
          this.studentName = `${profile.first_name} ${profile.last_name}`;
          this.studentId = profile.student_number || '';
          this.gradeLevel = profile.grade_level && profile.section 
            ? `${profile.grade_level} - ${profile.section}` 
            : profile.grade_level || 'Not assigned';
          
          // Set blood type
          this.bloodType = profile.blood_type || '--';
          
          // Calculate age from birth_date
          if (profile.birth_date) {
            this.age = this.calculateAge(profile.birth_date) + ' y/o';
          }
          
          // Fetch medical data (vitals, allergies, immunizations)
          this.loadMedicalData(profile.student_id);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading student profile:', error);
        this.error = 'Failed to load student data';
        this.loading = false;
      }
    });
  }

  loadMedicalData(studentId: number): void {
    this.studentService.getStudentMedicalData(studentId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const data = response.data;
          
          // Set vitals data
          if (data.vitals) {
            this.height = data.vitals.height_cm ? `${data.vitals.height_cm} cm` : '--';
            this.weight = data.vitals.weight_kg ? `${data.vitals.weight_kg} kg` : '--';
            this.bmi = data.vitals.bmi || '--';
            this.bmiPercentage = data.vitals.bmi ? `${data.vitals.bmi}%` : '--';
          }
          
          // Set allergies
          if (data.allergies && data.allergies.length > 0) {
            this.knownAllergies = data.allergies.map((a: any) => a.allergy_text);
            this.allergiesCount = data.allergies.length.toString();
          } else {
            this.knownAllergies = ['No known allergies'];
            this.allergiesCount = '0';
          }
          
          // Set immunizations
          if (data.immunizations && data.immunizations.length > 0) {
            this.immunizationRecords = data.immunizations.map((imm: any) => ({
              name: imm.vaccine_name,
              lastDate: this.formatDate(imm.date_administered),
              status: this.getImmunizationStatus(imm.date_administered)
            }));
          }
          
          // Set last visit
          if (data.last_visit) {
            this.lastVisit = this.formatDate(data.last_visit.visit_datetime);
          }
        }
      },
      error: (error) => {
        console.error('Error loading medical data:', error);
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  getImmunizationStatus(dateString: string): string {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const yearsDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    return yearsDiff > 2 ? 'Outdated' : 'Updated';
  }

  calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
}
