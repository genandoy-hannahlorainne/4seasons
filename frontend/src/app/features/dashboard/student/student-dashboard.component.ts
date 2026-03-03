import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, NavigationEnd, Router } from '@angular/router';
import { StudentService } from '../../../core/services/student.service';
import { AuthService } from '../../../core/services/auth.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.scss']
})
export class StudentDashboardComponent implements OnInit, OnDestroy {
  private routerSubscription?: Subscription;
  // Student information
  studentName = 'User';
  studentId = '';
  gradeLevel = '';
  studentGender = '';
  adviserName = 'Not assigned';
  adviserContact = 'N/A';
  
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
  
  // Recent activities instead of immunization records
  recentActivities: any[] = [];
  
  loading = true;
  error = '';
  
  // Medical form completion status
  showIncompleteFormNotification = false;
  incompleteFormMessage = '';

  constructor(
    private studentService: StudentService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load data initially
    this.loadStudentData();
    
    // Reload data whenever we navigate back to this route
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        // Check if we're on the dashboard route
        if (event.url.includes('/dashboard/student') && !event.url.includes('/dashboard/student/')) {
          console.log('Dashboard route detected, reloading data...');
          this.loadStudentData();
        }
      });
  }

  ngOnDestroy(): void {
    // Clean up subscription
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
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
        console.log('Profile response:', response);
        if (response.success && response.profile) {
          const profile = response.profile;
          
          // Set basic info
          this.studentName = `${profile.first_name} ${profile.last_name}`;
          this.studentId = profile.student_number || '';
          this.gradeLevel = profile.grade_level && profile.section 
            ? `Grade ${profile.grade_level} - ${profile.section}` 
            : profile.grade_level ? `Grade ${profile.grade_level}` : 'Not assigned';
          
          // Set gender
          this.studentGender = profile.gender || '';
          
          // Set blood type
          this.bloodType = profile.blood_type || '--';
          
          // Calculate age from birth_date
          if (profile.birth_date) {
            this.age = this.calculateAge(profile.birth_date) + ' y/o';
          }
          
          // Fetch medical data using user_id (not student_id)
          this.loadMedicalData(currentUser.user_id);
        } else {
          this.error = 'Failed to load student profile: ' + (response.message || 'Unknown error');
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading student profile:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error response:', error.error);
        this.error = 'Failed to load student data: ' + (error.error?.message || error.message || 'Unknown error');
        this.loading = false;
      }
    });
  }

  loadMedicalData(userId: number): void {
    this.studentService.getStudentMedicalData(userId).subscribe({
      next: (response) => {
        console.log('Medical data response:', response);
        if (response.success && response.data) {
          const data = response.data;
          
          // Check if medical form is incomplete
          this.checkFormCompletion(data);
          
          // Set vitals data from personal_info
          if (data.personal_info) {
            this.height = data.personal_info.height_cm ? `${data.personal_info.height_cm} cm` : '--';
            this.weight = data.personal_info.weight_kg ? `${data.personal_info.weight_kg} kg` : '--';
            this.bmi = data.personal_info.bmi ? data.personal_info.bmi.toFixed(1) : '--';
            this.bmiPercentage = data.personal_info.bmi ? `${data.personal_info.bmi.toFixed(1)}` : '--';
          } else {
            // Use default values when no vitals are available
            this.height = '--';
            this.weight = '--';
            this.bmi = '--';
            this.bmiPercentage = '--';
          }
          
          // Set allergies
          if (data.allergies && data.allergies.length > 0) {
            this.knownAllergies = data.allergies.map((a: any) => a.allergy_text);
            this.allergiesCount = data.allergies.length.toString();
          } else {
            this.knownAllergies = ['No known allergies'];
            this.allergiesCount = '0';
          }
          
          // Set adviser information
          if (data.personal_info) {
            this.adviserName = data.personal_info.adviser_name || 'Not assigned';
            this.adviserContact = data.personal_info.adviser_contact || 'N/A';
          }
          
          // Set recent activities (medical visits)
          if (data.recent_visits && data.recent_visits.length > 0) {
            this.recentActivities = data.recent_visits.map((visit: any) => ({
              activity: `Clinic Visit - ${visit.diagnosis || 'General checkup'}`,
              date: this.formatDate(visit.visit_datetime),
              type: visit.visit_type || 'Routine',
              status: visit.status || 'Completed'
            }));
          } else {
            this.recentActivities = [
              { activity: 'No recent activities', date: '--', type: 'Info', status: 'N/A' }
            ];
          }
          
          // Set last visit
          if (data.last_visit) {
            this.lastVisit = this.formatDate(data.last_visit.visit_datetime);
          }
          
          this.loading = false;
        } else {
          console.warn('Medical data response not successful:', response);
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading medical data:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error response:', error.error);
        // Don't set error state here - medical data is secondary
        // Dashboard should still show basic student info
        this.loading = false;
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  getActivityTypeClass(type: string): string {
    switch (type.toLowerCase()) {
      case 'emergency': return 'activity-emergency';
      case 'routine': return 'activity-routine';
      default: return 'activity-info';
    }
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

  getProfileIcon(): string {
    if (this.studentGender === 'M') {
      return 'assets/user-male.png';
    } else if (this.studentGender === 'F') {
      return 'assets/user-female.png';
    }
    return 'assets/user-male.png'; // default
  }

  checkFormCompletion(data: any): void {
    const missingFields: string[] = [];
    
    if (data.personal_info) {
      const info = data.personal_info;
      
      // Check Physical Information
      if (!info.height_cm || !info.weight_kg) {
        missingFields.push('Physical Information (Height & Weight)');
      }
      
      // Check Contact Information
      const emergencyContactName = (info.emergency_contact || info.emergency_contact_person || '').toString().trim();
      const emergencyContactPhone = (info.emergency_contact_phone || '').toString().trim();

      if (!emergencyContactName || !emergencyContactPhone) {
        missingFields.push('Contact Information (Emergency Contact)');
      }
      
      if (!info.address) {
        missingFields.push('Contact Information (Address)');
      }
    }
    
    // Check Medical History - if no medical_history data exists, it's incomplete
    if (!data.medical_history) {
      missingFields.push('Medical History');
    }
    
    // Show notification if any fields are missing
    if (missingFields.length > 0) {
      this.showIncompleteFormNotification = true;
      this.incompleteFormMessage = `Please complete your Personal Medical Information Form. Missing: ${missingFields.join(', ')}`;
    } else {
      this.showIncompleteFormNotification = false;
    }
  }

  dismissNotification(): void {
    this.showIncompleteFormNotification = false;
  }

  goToMedicalForm(): void {
    this.router.navigate(['/dashboard/student/medical-records/personal-info']);
  }

}
