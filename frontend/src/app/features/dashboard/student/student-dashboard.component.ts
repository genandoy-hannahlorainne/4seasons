import { Component, OnInit, OnDestroy, ViewChild, ViewContainerRef, ComponentRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, NavigationEnd, Router } from '@angular/router';
import { StudentService } from '../../../core/services/student.service';
import { AuthService } from '../../../core/services/auth.service';
import { BMIUtils } from '../../../shared/utils/bmi-utils';
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
  @ViewChild('formContainer', { read: ViewContainerRef, static: false }) formContainer!: ViewContainerRef;
  private formComponentRef?: ComponentRef<any>;
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

  // Modal state
  showComprehensiveModal = false;
  comprehensiveFormStudentId: number | null = null;



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

    console.log('🔄 Loading student data for user:', currentUser.user_id);

    // Fetch student profile
    this.studentService.getStudentProfile(currentUser.user_id).subscribe({
      next: (response) => {
        console.log('📋 Profile response:', response);
        console.log('📋 Profile response keys:', Object.keys(response));

        // Handle multiple response formats for compatibility
        let profile = null;

        if (response.success && response.profile) {
          profile = response.profile;
          console.log('📋 Using response.profile');
        } else if (response.success && response.data && response.data.profile) {
          profile = response.data.profile;
          console.log('📋 Using response.data.profile');
        } else if (response.profile) {
          profile = response.profile;
          console.log('📋 Using response.profile (no success check)');
        } else if (response.data && response.data.profile) {
          profile = response.data.profile;
          console.log('📋 Using response.data.profile (no success check)');
        }

        console.log('📋 Selected profile:', profile);
        console.log('📋 Profile keys:', profile ? Object.keys(profile) : 'null');

        if (profile && profile.first_name) {
          console.log('✅ Profile data found:', profile);

          // Set basic info
          this.studentName = `${profile.first_name} ${profile.last_name}`;
          this.studentId = profile.student_number || '';
          
          // Check if grade_level already contains "Grade" prefix
          const gradeLevel = profile.grade_level || '';
          const hasGradePrefix = gradeLevel.toLowerCase().includes('grade');
          
          this.gradeLevel = profile.grade_level && profile.section
            ? `${hasGradePrefix ? gradeLevel : 'Grade ' + gradeLevel} - ${profile.section}`
            : profile.grade_level 
              ? (hasGradePrefix ? gradeLevel : 'Grade ' + gradeLevel)
              : 'Not assigned';

          // Set gender
          this.studentGender = profile.gender || '';

          // Set blood type
          this.bloodType = profile.blood_type || '--';

          // Set adviser information from profile (if available)
          if (profile.adviser_name) {
            this.adviserName = profile.adviser_name;
            this.adviserContact = profile.adviser_contact || 'N/A';
            console.log('✅ Adviser info set from profile:', this.adviserName, this.adviserContact);
          } else {
            console.warn('⚠️ No adviser_name found in profile:', profile);
          }

          // Calculate age from birth_date
          if (profile.birth_date) {
            this.age = this.calculateAge(profile.birth_date) + ' y/o';
          }

          console.log('✅ Basic profile info set:', {
            name: this.studentName,
            id: this.studentId,
            grade: this.gradeLevel,
            gender: this.studentGender,
            bloodType: this.bloodType,
            adviser: this.adviserName,
            age: this.age
          });

          // Fetch medical data using user_id (not student_id)
          this.loadMedicalData(currentUser.user_id);
        } else {
          console.error('❌ No valid profile data found in response:', response);
          this.error = 'Failed to load student profile: Invalid data structure';
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('❌ Error loading student profile:', {
          status: error.status,
          message: error.message,
          error: error.error,
          url: error.url
        });

        let errorMessage = 'Failed to load student data';

        if (error.status === 401) {
          errorMessage = 'Authentication failed. Please login again.';
        } else if (error.status === 404) {
          errorMessage = 'Student record not found.';
        } else if (error.status === 0) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        this.error = errorMessage;
        this.loading = false;
      }
    });
  }

  loadMedicalData(userId: number): void {
    console.log('🔄 Loading medical data for user:', userId);

    this.studentService.getStudentMedicalData(userId).subscribe({
      next: (response) => {
        console.log('🏥 Medical data response:', response);

        if (response.success && response.data) {
          const data = response.data;

          console.log('✅ Medical data found:', data);

          // Set vitals data from personal_info
          if (data.personal_info) {
            this.height = data.personal_info.height_cm ? `${data.personal_info.height_cm} cm` : '--';
            this.weight = data.personal_info.weight_kg ? `${data.personal_info.weight_kg} kg` : '--';

            // Use BMI utility for safe formatting
            this.bmi = BMIUtils.formatBMI(data.personal_info.bmi);
            this.bmiPercentage = BMIUtils.formatBMI(data.personal_info.bmi);

            console.log('✅ Vitals set:', {
              height: this.height,
              weight: this.weight,
              bmi: this.bmi,
              bmiRaw: data.personal_info.bmi,
              bmiType: typeof data.personal_info.bmi
            });
          } else {
            console.warn('⚠️ No personal_info in medical data');
            // Use default values when no vitals are available
            this.height = '--';
            this.weight = '--';
            this.bmi = '--';
            this.bmiPercentage = '--';
          }

          // Set allergies
          if (data.allergies && data.allergies.length > 0) {
            this.knownAllergies = data.allergies.map((a: any) => a.allergy_name || a.allergy_text);
            this.allergiesCount = data.allergies.length.toString();
            console.log('✅ Allergies set:', this.knownAllergies);
          } else {
            this.knownAllergies = ['No known allergies'];
            this.allergiesCount = '0';
          }

          // Set adviser information (only if not already set from profile)
          if (data.personal_info && (!this.adviserName || this.adviserName === 'Not assigned')) {
            this.adviserName = data.personal_info.adviser_name || 'Not assigned';
            this.adviserContact = data.personal_info.adviser_contact || 'N/A';
            console.log('✅ Adviser info set from medical data:', this.adviserName);
          }

          // Set recent activities (medical visits)
          if (data.recent_visits && data.recent_visits.length > 0) {
            this.recentActivities = data.recent_visits.map((visit: any) => ({
              activity: `Clinic Visit - ${visit.diagnosis || 'General checkup'}`,
              date: this.formatDate(visit.visit_datetime),
              type: visit.visit_type || 'Routine',
              status: visit.status || 'Completed'
            }));
            console.log('✅ Recent activities set:', this.recentActivities.length);
          } else {
            this.recentActivities = [
              { activity: 'No recent activities', date: '--', type: 'Info', status: 'N/A' }
            ];
          }

          // Set last visit
          if (data.last_visit) {
            this.lastVisit = this.formatDate(data.last_visit.visit_datetime);
            console.log('✅ Last visit set:', this.lastVisit);
          }

          this.loading = false;
          console.log('✅ All student data loaded successfully');
        } else {
          console.warn('⚠️ Medical data response not successful:', response);
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('❌ Error loading medical data:', {
          status: error.status,
          message: error.message,
          error: error.error,
          url: error.url
        });

        // Don't set error state here - medical data is secondary
        // Dashboard should still show basic student info
        console.warn('⚠️ Medical data failed to load, but continuing with basic profile');
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

  goToSHDFForm(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.user_id) {
      // Get student_id from the loaded profile
      this.studentService.getStudentProfile(currentUser.user_id).subscribe({
        next: async (response) => {
          let profile = null;
          if (response.success && response.profile) {
            profile = response.profile;
          } else if (response.profile) {
            profile = response.profile;
          }

          if (profile && profile.student_id) {
            // Open comprehensive form in modal
            this.comprehensiveFormStudentId = profile.student_id;
            this.showComprehensiveModal = true;
            
            // Wait for view to update, then load form
            setTimeout(() => {
              this.loadFormComponent();
            }, 100);
          } else {
            console.error('Student ID not found');
            this.error = 'Unable to load SHDF form. Student ID not found.';
          }
        },
        error: (error) => {
          console.error('Error loading student profile for SHDF:', error);
          this.error = 'Unable to load SHDF form.';
        }
      });
    }
  }

  async loadFormComponent(): Promise<void> {
    if (!this.formContainer) {
      console.error('Form container not found');
      return;
    }
    
    console.log('Loading form component...');
    
    // Clear any existing component
    this.formContainer.clear();
    
    try {
      // Dynamically import and create the component
      const { SHDFFormComponent } = await import('../../shdf/shdf-form/shdf-form.component');
      this.formComponentRef = this.formContainer.createComponent(SHDFFormComponent);
      
      console.log('Form component created');
      
      // Set inputs
      this.formComponentRef.instance.studentId = this.comprehensiveFormStudentId;
      this.formComponentRef.instance.isModal = true;
      
      // Subscribe to outputs
      this.formComponentRef.instance.formSubmitted.subscribe(() => {
        this.onFormSubmitted();
      });
      
      this.formComponentRef.instance.formCancelled.subscribe(() => {
        this.closeComprehensiveModal();
      });
      
      // Trigger change detection
      this.formComponentRef.changeDetectorRef.detectChanges();
    } catch (error) {
      console.error('Error loading form component:', error);
      this.error = 'Failed to load form component';
    }
  }

  closeComprehensiveModal(): void {
    this.showComprehensiveModal = false;
    this.comprehensiveFormStudentId = null;
    
    // Destroy the component
    if (this.formComponentRef) {
      this.formComponentRef.destroy();
      this.formComponentRef = undefined;
    }
    
    // Reload dashboard data to reflect any changes
    this.loadStudentData();
  }

  onFormSubmitted(): void {
    // Close modal and reload data after successful submission
    this.closeComprehensiveModal();
  }
}
