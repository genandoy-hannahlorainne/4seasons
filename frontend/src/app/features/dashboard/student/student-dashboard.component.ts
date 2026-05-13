import { Component, OnInit, OnDestroy, ViewChild, ViewContainerRef, ComponentRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, NavigationEnd, Router } from '@angular/router';
import { StudentService } from '../../../core/services/student.service';
import { AuthService } from '../../../core/services/auth.service';
import { SHDFService, SHDFStatus } from '../../shdf/shdf.service';
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
  visitSummaries: any[] = [];
  unreadSummariesCount = 0;

  loading = true;
  error = '';

  // Modal state
  showComprehensiveModal = false;
  comprehensiveFormStudentId: number | null = null;
  showSummaryModal = false;

  // SHDF status
  shdfStatus: SHDFStatus | null = null;
  shdfStudentId: number | null = null;

  constructor(
    private studentService: StudentService,
    private authService: AuthService,
    private router: Router,
    private shdService: SHDFService
  ) {}

  ngOnInit(): void {
    // Load data initially
    this.loadStudentData();
    this.loadVisitSummaries();

    // Reload data whenever we navigate back to this route
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        // Check if we're on the dashboard route
        if (event.url.includes('/dashboard/student') && !event.url.includes('/dashboard/student/')) {
          // Dashboard route detected, reloading data
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

    // Loading student data for user

    // Fetch student profile
    this.studentService.getStudentProfile(currentUser.user_id).subscribe({
      next: (response) => {
        // Profile response received

        // Handle multiple response formats for compatibility
        let profile = null;

        if (response.success && response.profile) {
          profile = response.profile;
        } else if (response.success && response.data && response.data.profile) {
          profile = response.data.profile;
          // Using response.data.profile
        } else if (response.profile) {
          profile = response.profile;
          // Using response.profile (no success check)
        } else if (response.data && response.data.profile) {
          profile = response.data.profile;
          // Using response.data.profile (no success check)
        }

          // Selected profile parsed

        if (profile && profile.first_name) {
          // Profile data found

          // Set basic info
          this.studentName = `${profile.first_name} ${profile.last_name}`;
          this.studentId = profile.student_number || '';

          // Store student_id and load SHDF status
          this.shdfStudentId = profile.student_id || null;
          if (this.shdfStudentId) {
            this.shdService.getStatus(this.shdfStudentId).subscribe({
              next: (status) => { this.shdfStatus = status; },
              error: () => { this.shdfStatus = null; }
            });
          }
          
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
            // Adviser info set from profile
          } else {
            // No adviser_name found in profile
          }

          // Calculate age from birth_date
          if (profile.birth_date) {
            this.age = this.calculateAge(profile.birth_date) + ' y/o';
          }

          // Basic profile info set

          // Fetch medical data using user_id (not student_id)
          this.loadMedicalData(currentUser.user_id);
        } else {
          // No valid profile data found in response
          this.error = 'Failed to load student profile: Invalid data structure';
          this.loading = false;
        }
      },
      error: (error) => {
        // Error loading student profile

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
  // Loading medical data for user

    this.studentService.getStudentMedicalData(userId).subscribe({
      next: (response) => {
        // Medical data response received

        if (response.success && response.data) {
          const data = response.data;

          // Medical data found

          // Set vitals data from personal_info
          if (data.personal_info) {
            this.height = data.personal_info.height_cm ? `${data.personal_info.height_cm} cm` : '--';
            this.weight = data.personal_info.weight_kg ? `${data.personal_info.weight_kg} kg` : '--';

            // Use BMI utility for safe formatting
            this.bmi = BMIUtils.formatBMI(data.personal_info.bmi);
            this.bmiPercentage = BMIUtils.formatBMI(data.personal_info.bmi);

            // Vitals set
          } else {
            // No personal_info in medical data
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
            // Allergies set
          } else {
            this.knownAllergies = ['No known allergies'];
            this.allergiesCount = '0';
          }

          // Set adviser information (only if not already set from profile)
          if (data.personal_info && (!this.adviserName || this.adviserName === 'Not assigned')) {
            this.adviserName = data.personal_info.adviser_name || 'Not assigned';
            this.adviserContact = data.personal_info.adviser_contact || 'N/A';
            // Adviser info set from medical data
          }

          // Set recent activities (medical visits)
          if (data.recent_visits && data.recent_visits.length > 0) {
            this.recentActivities = data.recent_visits.slice(0, 3).map((visit: any) => ({
              activity: `Clinic Visit - ${visit.diagnosis || 'General checkup'}`,
              date: this.formatDate(visit.visit_datetime),
              type: visit.visit_type || 'Routine',
              status: visit.status || 'Completed'
            }));
            // Recent activities set
          } else {
            this.recentActivities = [
              { activity: 'No recent activities', date: '--', type: 'Info', status: 'N/A' }
            ];
          }

          // Set last visit
          if (data.last_visit) {
            this.lastVisit = this.formatDate(data.last_visit.visit_datetime);
            // Last visit set
          }

          this.loading = false;
          // All student data loaded successfully
        } else {
          // Medical data response not successful
          this.loading = false;
        }
      },
      error: (error) => {
        // Error loading medical data

        // Don't set error state here - medical data is secondary
        // Dashboard should still show basic student info
        // Medical data failed to load, but continuing with basic profile
        this.loading = false;
      }
    });
  }

  loadVisitSummaries(): void {
    this.studentService.getVisitSummaries().subscribe({
      next: (response) => {
        const data = response?.data ?? response;
        this.visitSummaries = data?.summaries ?? [];
        this.unreadSummariesCount = data?.unread_count ?? 0;
      },
      error: () => {}
    });
  }

  downloadVisitSummariesPdf(): void {
    Promise.all([import('jspdf'), import('jspdf-autotable')]).then(([{ jsPDF }, autoTable]) => {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();

        // Header background
        doc.setFillColor(5, 35, 85);
        doc.rect(0, 0, pageW, 32, 'F');

        // Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('PDMHS StudentCare+', 14, 13);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Clinic Visit Summaries', 14, 21);

        // Student info (right side of header)
        doc.setFontSize(9);
        doc.text(this.studentName, pageW - 14, 13, { align: 'right' });
        doc.text(this.studentId + ' • ' + this.gradeLevel, pageW - 14, 20, { align: 'right' });
        doc.text('Generated: ' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), pageW - 14, 27, { align: 'right' });

        // Table
        (autoTable.default)(doc, {
          startY: 40,
          head: [['#', 'Date', 'Type', 'Complaint', 'Notes', 'Attended By', 'Status']],
          body: this.visitSummaries.map((s, i) => [
            i + 1,
            this.formatDate(s.visit_datetime),
            s.visit_type,
            s.chief_complaint || '—',
            s.notes || '—',
            s.attended_by || '—',
            s.status || '—',
          ]),
          headStyles: {
            fillColor: [5, 35, 85],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9,
          },
          bodyStyles: { fontSize: 8.5, textColor: [30, 30, 30] },
          alternateRowStyles: { fillColor: [240, 244, 248] },
          columnStyles: {
            0: { cellWidth: 8, halign: 'center' },
            1: { cellWidth: 24 },
            2: { cellWidth: 20 },
            3: { cellWidth: 45 },
            4: { cellWidth: 35 },
            5: { cellWidth: 30 },
            6: { cellWidth: 18 },
          },
          margin: { left: 14, right: 14 },
          didDrawPage: (data: any) => {
            // Footer
            const pageCount = (doc as any).internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(
              `Page ${data.pageNumber} of ${pageCount}`,
              pageW / 2,
              doc.internal.pageSize.getHeight() - 8,
              { align: 'center' }
            );
          },
        });

        doc.save(`visit-summaries-${this.studentId || 'student'}.pdf`);
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
      return 'bi bi-person-circle';
    } else if (this.studentGender === 'F') {
      return 'bi bi-person-circle';
    }
    return 'bi bi-person-circle';
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
            // Student ID not found
            this.error = 'Unable to load SHDF form. Student ID not found.';
          }
        },
        error: (error) => {
          // Error loading student profile for SHDF
          this.error = 'Unable to load SHDF form.';
        }
      });
    }
  }

  async loadFormComponent(): Promise<void> {
    if (!this.formContainer) {
      // Form container not found
      return;
    }
    
    // Loading form component
    
    // Clear any existing component
    this.formContainer.clear();
    
    try {
      // Dynamically import and create the component
      const { SHDFFormComponent } = await import('../../shdf/shdf-form/shdf-form.component');
      this.formComponentRef = this.formContainer.createComponent(SHDFFormComponent);
      
      // Form component created
      
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
      // Error loading form component
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
