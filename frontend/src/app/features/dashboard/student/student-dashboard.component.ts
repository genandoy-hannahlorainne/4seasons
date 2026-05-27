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
            this.recentActivities = data.recent_visits.slice(0, 5).map((visit: any) => ({
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
      const NAVY: [number, number, number] = [10, 45, 110];
      const BLUE_MID: [number, number, number] = [180, 205, 245];
      const BLUE_LIGHT: [number, number, number] = [235, 241, 255];
      const GRAY: [number, number, number] = [100, 100, 100];
      const DARK: [number, number, number] = [30, 30, 30];
      const WHITE: [number, number, number] = [255, 255, 255];

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 15;
      const printedDate = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: '2-digit' });

      const logoImg = new Image();
      logoImg.src = 'assets/pdmhs-logo.png';

      const buildPDF = () => {
        try {
          if (logoImg.complete && logoImg.naturalWidth > 0) doc.addImage(logoImg, 'PNG', margin, 11, 18, 18);
        } catch (_) {}

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(...NAVY);
        doc.text('StudentCare+: PDMHS Medical Record System', margin + 22, 16);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.4);
        doc.setTextColor(...GRAY);
        doc.text('President Diosdado Macapagal High School', margin + 22, 21.5);

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.2);
        doc.text('8th Street GHQ Village, Katuparan, Taguig, Philippines', margin + 22, 26);

        doc.setDrawColor(...BLUE_MID);
        doc.line(margin, 30.5, pageW - margin, 30.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12.2);
        doc.setTextColor(...NAVY);
        doc.text('CLINIC VISIT SUMMARIES', pageW / 2, 36, { align: 'center' });

        doc.setDrawColor(...BLUE_MID);
        doc.line(margin, 40, pageW - margin, 40);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.4);
        doc.setTextColor(...GRAY);
        doc.text(`Student: ${this.studentName}`, margin, 44);
        doc.text(`ID: ${this.studentId}  •  ${this.gradeLevel}`, pageW / 2, 44, { align: 'center' });
        doc.text(`Printed: ${printedDate}`, pageW - margin, 44, { align: 'right' });
        doc.text(`Adviser: ${this.adviserName}`, margin, 48.5);
        doc.line(margin, 51, pageW - margin, 51);

        (autoTable.default)(doc, {
          startY: 55,
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
          headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 8.5 },
          bodyStyles: { fontSize: 8, textColor: DARK },
          alternateRowStyles: { fillColor: BLUE_LIGHT },
          columnStyles: {
            0: { cellWidth: 8, halign: 'center' },
            1: { cellWidth: 22 },
            2: { cellWidth: 20 },
            3: { cellWidth: 42 },
            4: { cellWidth: 35 },
            5: { cellWidth: 30 },
            6: { cellWidth: 18 },
          },
          margin: { left: margin, right: margin },
          didDrawPage: (data: any) => {
            const pageCount = (doc as any).internal.getNumberOfPages();
            doc.setDrawColor(...BLUE_MID);
            doc.line(margin, pageH - 17, pageW - margin, pageH - 17);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.8);
            doc.setTextColor(...GRAY);
            doc.text(`StudentCare+ | ${this.studentName}`, margin, pageH - 12.5);
            doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageW - margin, pageH - 12.5, { align: 'right' });
          },
        });

        doc.save(`visit-summaries-${this.studentId || 'student'}.pdf`);
      };

      if (logoImg.complete) {
        buildPDF();
      } else {
        logoImg.onload = () => buildPDF();
        logoImg.onerror = () => buildPDF();
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

  getThisMonthVisits(): number {
    const now = new Date();
    return this.visitSummaries.filter(v => {
      const d = new Date(v.visit_datetime);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }

  getEmergencyVisits(): number {
    return this.visitSummaries.filter(v =>
      (v.visit_type || '').toLowerCase() === 'emergency'
    ).length;
  }

  getRoutineVisits(): number {
    return this.visitSummaries.filter(v =>
      (v.visit_type || '').toLowerCase() === 'routine'
    ).length;
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

  goToSHDFBasic(): void {
    const currentUser = this.authService.currentUserValue;
    const studentId = currentUser?.student_info?.student_id;
    if (studentId) {
      this.router.navigate(['/shdf', studentId, 'basic']);
    }
  }

  goToSHDFForm(): void {    const currentUser = this.authService.currentUserValue;
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
